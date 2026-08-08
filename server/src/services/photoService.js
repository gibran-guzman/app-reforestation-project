const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');
const { PhotoUploadError } = require('../errors/AppError');
const { PHOTO_BUCKET: BUCKET } = require('../config/constants');

const SIGNED_URL_TTL_SECONDS = 3600;

const ensureBucket = async () => {
  const bucketOptions = {
    public: false,
    fileSizeLimit: 5 * 1024 * 1024,
  };

  const { data: buckets } = await supabase.storage.listBuckets();
  const existing = buckets?.find((b) => b.name === BUCKET);
  if (existing) {
    const { error } = await supabase.storage.updateBucket(BUCKET, bucketOptions);
    if (error) {
      logger.error({ error }, 'Error al actualizar el bucket de almacenamiento');
      throw new PhotoUploadError('Error al configurar permisos del bucket');
    }
    logger.info({ bucket: BUCKET }, 'Bucket de almacenamiento actualizado');
  } else {
    const { error } = await supabase.storage.createBucket(BUCKET, bucketOptions);
    if (error) {
      logger.error({ error }, 'Error al crear el bucket de almacenamiento');
      throw new PhotoUploadError('Error al inicializar almacenamiento de fotos');
    }
    logger.info({ bucket: BUCKET }, 'Bucket de almacenamiento creado');
  }
};

const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const uploadPhoto = async (plantingId, file) => {
  const ext = MIME_EXT[file.mimetype];
  if (!ext) {
    logger.error({ mimetype: file.mimetype, plantingId }, 'Tipo de archivo no permitido para foto');
    throw new PhotoUploadError('Tipo de archivo no permitido');
  }
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

  logger.info({ plantingId, filePath }, 'Foto subida exitosamente');
  return { filePath };
};

const getSignedUrl = async (filePath, expiresIn = SIGNED_URL_TTL_SECONDS) => {
  if (!filePath) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    logger.warn({ error, filePath }, 'Error al generar URL firmada para foto');
    return null;
  }

  return data.signedUrl;
};

const deletePhoto = async (filePath) => {
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) {
    logger.error({ error, filePath }, 'Error al limpiar foto huérfana');
    throw new PhotoUploadError('Error al limpiar la foto anterior');
  }
};

module.exports = { ensureBucket, uploadPhoto, getSignedUrl, deletePhoto };
