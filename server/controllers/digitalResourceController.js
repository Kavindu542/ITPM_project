const DigitalResource = require('../models/DigitalResource');

const normalizePath = (p) => (p ? p.replace(/\\/g, '/') : p);

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
      payload.thumbnailImage = normalizePath(`uploads/library/${req.files.thumbnailImage[0].filename}`);
    }
    if (req.files?.file?.[0]) {
      payload.url = normalizePath(`uploads/library/${req.files.file[0].filename}`);
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
    const payload = { ...req.body };

    if (req.files?.thumbnailImage?.[0]) {
      payload.thumbnailImage = normalizePath(`uploads/library/${req.files.thumbnailImage[0].filename}`);
    }
    if (req.files?.file?.[0]) {
      payload.url = normalizePath(`uploads/library/${req.files.file[0].filename}`);
      payload.format = 'PDF';
    }

    const resource = await DigitalResource.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.json({ success: true, data: resource });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const resource = await DigitalResource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.json({ success: true, message: 'Resource deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};