const UserLibrary = require('../models/UserLibrary');
const Book = require('../models/Book');

exports.getUserLibrary = async (req, res) => {
    try {
        const library = await UserLibrary.find({ userId: req.user.id })
            .populate('bookId', 'title author coverImage fileUrl type')
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, data: library });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addToLibrary = async (req, res) => {
    try {
        const { bookId, status } = req.body; // status: Favorite or Downloaded
        let entry = await UserLibrary.findOne({ userId: req.user.id, bookId });

        if (entry) {
            entry.status = status || 'Favorite';
            await entry.save();
        } else {
            entry = await UserLibrary.create({
                userId: req.user.id,
                bookId,
                status: status || 'Favorite'
            });
        }

        res.status(200).json({ success: true, data: entry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.removeFromLibrary = async (req, res) => {
    try {
        const { id } = req.params;
        await UserLibrary.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
