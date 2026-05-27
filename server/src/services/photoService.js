const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const { AppError } = require('../errors/AppError');

const BUCKET = 'planting-photos';

const ensureBucket = async () => {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find((b) => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
    });
    if (error) {
      logger.error({ error }, 'Error al crear el bucket de almacenamiento');
      throw new AppError('Error al inicializar almacenamiento de fotos', 500);
    }
    logger.info({ bucket: BUCKET }, 'Bucket de almacenamiento creado');
  }
};

const uploadPhoto = async (plantingId, file) => {
  const ext = file.mimetype === 'image/jpeg' ? 'jpg' : file.mimetype === 'image/png' ? 'png' : 'webp';
  const filePath = `plantings/${plantingId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    logger.error({ error: uploadError, plantingId }, 'Error al subir foto a Supabase Storage');
    throw new AppError('Error al subir la foto', 500);
  }

  const { data: publicUrl } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  logger.info({ plantingId, filePath }, 'Foto subida exitosamente');
  return publicUrl.publicUrl;
};

module.exports = { ensureBucket, uploadPhoto };
