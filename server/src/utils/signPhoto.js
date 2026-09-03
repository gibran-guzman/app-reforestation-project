const { getSignedUrl } = require('../services/photoService');

const isSignedUrl = (value) =>
  typeof value === 'string' && /^https?:\/\//.test(value);

const signPhotoUrl = async (photoUrl) => {
  if (!photoUrl || isSignedUrl(photoUrl)) return photoUrl;
  return getSignedUrl(photoUrl);
};

const signPhotoRow = async (row) => {
  if (!row || !row.photo_url || isSignedUrl(row.photo_url)) return row;
  const signed = await getSignedUrl(row.photo_url);
  return signed && signed !== row.photo_url ? { ...row, photo_url: signed } : row;
};

const signPhotoRows = async (rows) => Promise.all((rows || []).map(signPhotoRow));

module.exports = { signPhotoUrl, signPhotoRow, signPhotoRows };
