const DigitalResource = require('../models/DigitalResource');
const {
  uploadBufferToObjectStorage,
  deleteObjectFromStorage,
} = require('../utils/objectStorage');

const normalizePath = (p) => (p ? p.replace(/\\/g, '/') : p);

const uploadLibraryAsset = async (file, folder) => {
  if (!file) return '';

  const uploaded = await uploadBufferToObjectStorage({
    buffer: file.buffer,
    originalName: file.originalname,
    mimeType: file.mimetype,
    folder,
  });

  return normalizePath(uploaded.url);
};

const cleanupOldAsset = async (oldRef, newRef) => {
  const oldValue = String(oldRef || '').trim();
  const newValue = String(newRef || '').trim();
  if (!oldValue || !newValue || oldValue === newValue) return;
  await deleteObjectFromStorage(oldValue).catch(() => {});
};

exports.getAllResources = async (req, res) => {
  try {
    const { search = '', category, type } = req.query;
    const q = {};

    if (search) {
      q.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (category && category !== 'All') q.category = category;
    if (type && type !== 'All') q.type = type;

    const resources = await DigitalResource.find(q).sort({ createdAt: -1 });
    res.json({ success: true, data: resources });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getResourceById = async (req, res) => {
  try {
    const resource = await DigitalResource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.json({ success: true, data: resource });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createResource = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (req.files?.thumbnailImage?.[0]) {
      payload.thumbnailImage = await uploadLibraryAsset(
        req.files.thumbnailImage[0],
        'library/digital-thumbnails',
      );
    }
    if (req.files?.file?.[0]) {
      payload.url = await uploadLibraryAsset(
        req.files.file[0],
        'library/digital-files',
      );
      payload.format = 'PDF';
    }

    const resource = await DigitalResource.create(payload);
    res.status(201).json({ success: true, data: resource });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.updateResource = async (req, res) => {
  try {
    const existing = await DigitalResource.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const payload = { ...req.body };
    const oldThumbnail = existing.thumbnailImage;
    const oldUrl = existing.url;

    if (req.files?.thumbnailImage?.[0]) {
      payload.thumbnailImage = await uploadLibraryAsset(
        req.files.thumbnailImage[0],
        'library/digital-thumbnails',
      );
    }
    if (req.files?.file?.[0]) {
      payload.url = await uploadLibraryAsset(
        req.files.file[0],
        'library/digital-files',
      );
      payload.format = 'PDF';
    }

    Object.assign(existing, payload);
    await existing.save();

    if (payload.thumbnailImage) {
      await cleanupOldAsset(oldThumbnail, payload.thumbnailImage);
    }
    if (payload.url) {
      await cleanupOldAsset(oldUrl, payload.url);
    }

    res.json({ success: true, data: existing });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const resource = await DigitalResource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

    await Promise.all([
      deleteObjectFromStorage(resource.thumbnailImage).catch(() => {}),
      deleteObjectFromStorage(resource.url).catch(() => {}),
    ]);

    res.json({ success: true, message: 'Resource deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};