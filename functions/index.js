
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");

initializeApp();
const db = getFirestore();

async function commitInChunks(writes, size = 400) {
  for (let i = 0; i < writes.length; i += size) {
    const batch = db.batch();
    for (const write of writes.slice(i, i + size)) write(batch);
    await batch.commit();
  }
}

/**
 * Ketika profil users/{uid} dihapus oleh Admin:
 * 1. Hapus akun dari Firebase Authentication.
 * 2. Jika akun Mitra, nonaktifkan profil mitranya.
 * 3. Nonaktifkan seluruh menu milik mitra tersebut.
 * 4. Batalkan permintaan stok yang masih pending.
 * 5. Pertahankan riwayat transaksi dan keuangan untuk audit.
 */
exports.removeFirebaseIdentityAfterProfileDeletion = onDocumentDeleted(
  {
    document: "users/{uid}",
    region: "asia-southeast2",
    retry: true
  },
  async (event) => {
    const uid = event.params.uid;
    const deletedProfile = event.data?.data();

    if (!deletedProfile) return;

    // Hapus identitas Firebase Authentication.
    // Jika akun sudah tidak ada, anggap proses sudah selesai.
    try {
      await getAuth().deleteUser(uid);
      logger.info("Deleted Firebase Authentication user", { uid });
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        logger.error("Unable to delete Firebase Authentication user", {
          uid,
          code: error.code
        });
        throw error;
      }
    }

    // Jika bukan akun mitra, proses selesai.
    if (
      deletedProfile.role !== "partner" ||
      !deletedProfile.partnerId
    ) return;

    const partnerId = deletedProfile.partnerId;
    const partnerRef = db.collection("partners").doc(partnerId);

    // Nonaktifkan profil mitra.
    const partnerSnap = await partnerRef.get();

    if (partnerSnap.exists) {
      await partnerRef.set({
        active: false,
        linkedUserUid: null,
        deactivatedAt: FieldValue.serverTimestamp(),
        deactivatedReason: "partner-account-deleted"
      }, { merge: true });
    }

    // Nonaktifkan semua menu milik mitra.
    const menusSnap = await db
      .collection("menus")
      .where("partnerId", "==", partnerId)
      .get();

    await commitInChunks(
      menusSnap.docs.map(snap => batch =>
        batch.update(snap.ref, {
          active: false,
          deactivatedAt: FieldValue.serverTimestamp(),
          deactivatedReason: "partner-account-deleted"
        })
      )
    );

    // Batalkan permintaan stok yang belum disetujui.
    const requestsSnap = await db
      .collection("stockRequests")
      .where("partnerId", "==", partnerId)
      .get();

    const pending = requestsSnap.docs.filter(
      snap => snap.data().status === "pending"
    );

    await commitInChunks(
      pending.map(snap => batch =>
        batch.update(snap.ref, {
          status: "cancelled",
          cancelledAt: FieldValue.serverTimestamp(),
          cancellationReason: "partner-account-deleted"
        })
      )
    );

    logger.info("Archived partner account resources", {
      uid,
      partnerId,
      deactivatedMenus: menusSnap.size,
      cancelledRequests: pending.length
    });
  }
);
