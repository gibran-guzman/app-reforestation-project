const crypto = require('node:crypto');
const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');
const { PhotoUploadError } = require('../errors/AppError');
const { PHOTO_BUCKET: BUCKET } = require('../config/constants');

const ensureBucket = async () => {
  const { data: buckets } = await supabase.storage.listBuckets();
  const existing = buckets?.find((b) => b.name === BUCKET);
  if (existing) {
    const { error } = await supabase.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
    });
    if (error) {
      logger.error({ error }, 'Error al actualizar el bucket de almacenamiento');
      throw new PhotoUploadError('Error al configurar permisos del bucket');
    }
    logger.info({ bucket: BUCKET }, 'Bucket de almacenamiento actualizado');
  } else {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
    });
    if (error) {
      logger.error({ error }, 'Error al crear el bucket de almacenamiento');
      throw new PhotoUploadError('Error al inicializar almacenamiento de fotos');
    }
    logger.info({ bucket: BUCKET }, 'Bucket de almacenamiento creado');
  }
};

const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const uploadPhoto = async (plantingId, file) => {
  const ext = MIME_EXT[file.mimetype] || 'webp';
  const filePath = `plantings/${plantingId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    logger.error({ error: uploadError, plantingId }, 'Error al subir foto a Supabase Storage');
    throw new PhotoUploadError('Error al subir la foto');
  }

  const { data: publicUrl } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  logger.info({ plantingId, filePath }, 'Foto subida exitosamente');
  return { publicUrl: publicUrl.publicUrl, filePath };
};

const deletePhoto = async (filePath) => {
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) {
    logger.error({ error, filePath }, 'Error al limpiar foto huérfana');
    throw new PhotoUploadError('Error al limpiar la foto anterior');
  }
};

module.exports = { ensureBucket, uploadPhoto, deletePhoto };
