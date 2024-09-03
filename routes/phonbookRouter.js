const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Phonebook = require('../models/phonebookModel');
const User = require('../models/userModel');
const { isAuth, hasRole } = require('../utils');
const Comment = require('../models/commentModel');
const router = express.Router();
const upload = multer({ dest: 'uploads' });
const Client = require('../models/clientModel');
const mongoose = require('mongoose');

const isValidPhoneNumber = (number) => {
    // Check if number starts with + and has at least 13 characters including +
    return /^\+\d{12,}$/.test(number);
};
router.put('/update-calstatus/:phonebookId', isAuth, async (req, res) => {
    try {
        const { calstatus } = req.body;
        const { phonebookId } = req.params;

        // Validate the calstatus value
        if (!['Req to call', 'No Answer', 'Not Interested', 'Convert to Lead'].includes(calstatus)) {
            return res.status(400).json({ message: 'Invalid calstatus value' });
        }

        // Find and update the phonebook entry's calstatus
        const phonebookEntry = await Phonebook.findByIdAndUpdate(phonebookId, { calstatus }, { new: true });
        if (!phonebookEntry) {
            return res.status(404).json({ message: 'Phonebook entry not found' });
        }

        res.status(200).json({ message: 'Calstatus updated successfully!', phonebookEntry });
    } catch (error) {
        console.error('Error updating calstatus:', error);
        res.status(500).json({ message: 'Error updating calstatus' });
    }
});
router.post('/upload-csv-for-superadmin', upload.single('file'), async (req, res) => {
    try {
        const { userId, pipelineId, visibilityUserId } = req.body;

        // Validate required fields
        if (!userId || !pipelineId) {
            return res.status(400).json({ message: 'User ID and Pipeline ID are required' });
        }

        const filePath = path.join(__dirname, '../uploads', req.file.filename);
        const phonebookData = new Map(); // Use Map to ensure uniqueness

        // Parse CSV file
        fs.createReadStream(filePath)
            .pipe(csv(['number', 'status']))
            .on('data', (row) => {
                if (row.number && row.status) {
                    const formattedNumber = `+${row.number.trim()}`;

                    // Use Map to avoid duplicate numbers
                    if (!phonebookData.has(formattedNumber)) {
                        phonebookData.set(formattedNumber, row.status);
                    }
                }
            })
            .on('end', async () => {
                try {
                    // Find existing phone numbers in the Phonebook model
                    const existingPhonebookEntries = await Phonebook.find({
                        number: { $in: Array.from(phonebookData.keys()) }
                    }).select('number').exec();
                    
                    const existingPhoneNumbers = new Set(existingPhonebookEntries.map(entry => entry.number));

                    // Filter out phone numbers that already exist in the Phonebook model
                    const newPhonebookEntries = Array.from(phonebookData)
                        .filter(([number]) => !existingPhoneNumbers.has(number))
                        .map(([number, status]) => ({
                            user: userId,
                            pipeline: pipelineId,
                            number: number,
                            status: status,
                        }));

                    // Get visibility users based on roles
                    const pipelineUsers = await User.find({ pipeline: pipelineId, role: { $in: ['HOD', 'Manager'] } }).exec();
                    const allUsers = await User.find({ role: { $in: ['CEO', 'MD', 'superadmin'] } }).exec();

                    const visibilityUsers = new Set([
                        userId, // Add the userId from the request
                        visibilityUserId, // Add the specified visibility user
                        ...pipelineUsers.map(user => user._id.toString()),
                        ...allUsers.map(user => user._id.toString())
                    ]);

                    // Insert new phonebook entries with visibility
                    if (newPhonebookEntries.length > 0) {
                        await Phonebook.insertMany(newPhonebookEntries.map(entry => ({
                            ...entry,
                            visibility: Array.from(visibilityUsers)
                        })));
                    }

                    res.status(200).json({ message: 'Phonebook entries added successfully!' });
                } catch (error) {
                    console.error('Error inserting phonebook entries:', error);
                    res.status(500).json({ message: 'Error inserting phonebook entries' });
                } finally {
                    // Delete the file after processing
                    fs.unlink(filePath, (err) => {
                        if (err) console.error('Error deleting file:', err);
                    });
                }
            })
            .on('error', (error) => {
                console.error('Error parsing CSV file:', error);
                res.status(500).json({ message: 'Error parsing CSV file' });
            });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Error processing request' });
    }
});

router.post('/upload-csv', upload.single('file'), async (req, res) => {
    try {
        const { userId, pipelineId, visibilityUserIds } = req.body;

        // Validate required fields
        if (!userId || !pipelineId) {
            return res.status(400).json({ message: 'User ID and Pipeline ID are required' });
        }

        // Ensure visibilityUserIds is an array
        const visibilityUserIdsArray = Array.isArray(visibilityUserIds) ? visibilityUserIds : [];

        const filePath = path.join(__dirname, '../uploads', req.file.filename);
        const phonebookData = new Map(); // Use Map to ensure uniqueness

        // Parse CSV file
        fs.createReadStream(filePath)
            .pipe(csv(['number', 'status']))
            .on('data', (row) => {
                if (row.number && row.status) {
                    const formattedNumber = `+${row.number.trim()}`;

                    // Validate phone number
                    if (isValidPhoneNumber(formattedNumber)) {
                        // Use Map to avoid duplicate numbers
                        if (!phonebookData.has(formattedNumber)) {
                            phonebookData.set(formattedNumber, row.status);
                        }
                    } else {
                        console.warn(`Invalid phone number: ${formattedNumber}`);
                    }
                }
            })
            .on('end', async () => {
                try {
                    // Find existing phone numbers in the Phonebook model
                    const existingPhonebookEntries = await Phonebook.find({
                        number: { $in: Array.from(phonebookData.keys()) }
                    }).select('number').exec();
                    
                    const existingPhoneNumbers = new Set(existingPhonebookEntries.map(entry => entry.number));

                    // Filter out phone numbers that already exist in the Phonebook model
                    const newPhonebookEntries = Array.from(phonebookData)
                        .filter(([number]) => !existingPhoneNumbers.has(number))
                        .map(([number, status]) => ({
                            user: userId,
                            pipeline: pipelineId,
                            number: number,
                            status: status,
                        }));

                    // Get visibility users based on roles
                    const pipelineUsers = await User.find({ pipeline: pipelineId, role: { $in: ['HOD', 'Manager'] } }).exec();
                    const allUsers = await User.find({ role: { $in: ['CEO', 'MD', 'superadmin'] } }).exec();

                    // Ensure visibilityUserIdsArray contains unique IDs
                    const visibilityUsers = new Set([
                        userId, // Add the userId from the request
                        ...visibilityUserIdsArray,
                        ...pipelineUsers.map(user => user._id.toString()),
                        ...allUsers.map(user => user._id.toString())
                    ]);

                    // Insert new phonebook entries with visibility
                    if (newPhonebookEntries.length > 0) {
                        await Phonebook.insertMany(newPhonebookEntries.map(entry => ({
                            ...entry,
                            visibility: Array.from(visibilityUsers)
                        })));
                    }

                    res.status(200).json({ message: 'Phonebook entries added successfully!' });
                } catch (error) {
                    console.error('Error inserting phonebook entries:', error);
                    res.status(500).json({ message: 'Error inserting phonebook entries' });
                } finally {
                    // Delete the file after processing
                    fs.unlink(filePath, (err) => {
                        if (err) console.error('Error deleting file:', err);
                    });
                }
            })
            .on('error', (error) => {
                console.error('Error parsing CSV file:', error);
                res.status(500).json({ message: 'Error parsing CSV file' });
            });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Error processing request' });
    }
});

router.get('/get-all-phonebook', isAuth , async (req, res) => {
    try {
        // Make sure req.user is populated by your authentication middleware
        const userId = req.user?._id; // Use optional chaining to avoid errors if req.user is undefined

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Query to find phonebook entries where calstatus is not 'Convert to Lead' and visibility includes req.user._id
        const phonebookEntries = await Phonebook.find({
            status: 'UNBLOCKED',
            visibility: userId // Match documents where visibility array contains the userId
        })
            .populate('user', 'name')
            .populate('pipeline', 'name')
            .populate('visibility', 'name role')
            .populate({
                path: 'comments',
                populate: {
                    path: 'user',
                    select: 'name image', // Only fetch the name of the user who made the comment
                }
            });

        res.status(200).json(phonebookEntries);
    } catch (error) {
        console.error('Error fetching phonebook entries:', error);
        res.status(500).json({ message: 'Error fetching phonebook entries' });
    }
});
// router.get('/get-all-phonebook-users', isAuth, async (req, res) => {
//     try {
//         const userId = req.user._id;

//         const phonebookEntries = await Phonebook.find({
//             user: userId, 
//             calstatus: { $ne: 'Convert to Lead' } // Exclude entries where calstatus is 'Convert to Lead'
//         })
//             .populate('user', 'name') // Populate the user field with only the name
//             .populate('pipeline', 'name') // Populate the pipeline field with only the name
//             .populate({
//                 path: 'comments',
//                 populate: {
//                     path: 'user',
//                     select: 'name', // Only fetch the name of the user who made the comment
//                 }
//             });

//         res.status(200).json(phonebookEntries);
//     } catch (error) {
//         console.error('Error fetching phonebook entries:', error);
//         res.status(500).json({ message: 'Error fetching phonebook entries' });
//     }
// });

// router.get('/get-phonebook-by-user/:userId', isAuth, async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const phonebookEntries = await Phonebook.find({ user: userId })
//             .populate('user', 'name');
//         res.status(200).json(phonebookEntries);
//     } catch (error) {
//         console.error('Error fetching phonebook entries by user:', error);
//         res.status(500).json({ message: 'Error fetching phonebook entries by user' });
//     }
// });
// New Route: Add a comment to a specific phonebook entry
router.post('/add-comment', isAuth, async (req, res) => {
    try {
        const { phonebookId, comment } = req.body;

        // Validate required fields
        if (!phonebookId || !comment) {
            return res.status(400).json({ message: 'Phonebook ID and comment are required' });
        }

        // Find the phonebook entry
        const phonebookEntry = await Phonebook.findById(phonebookId);
        if (!phonebookEntry) {
            return res.status(404).json({ message: 'Phonebook entry not found' });
        }

        // Create a new comment
        const newComment = new Comment({
            user: req.user._id,
            remarks: comment,
        });
        await newComment.save();

        // Add the comment to the phonebook entry's comments array
        phonebookEntry.comments.push(newComment._id);
        await phonebookEntry.save();

        res.status(200).json({ message: 'Comment added successfully!', comment: newComment });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Error adding comment' });
    }
});

// New Route: Get all phonebook entries with status "BLOCKED"
router.get('/get-blocked-numbers', isAuth, async (req, res) => {
    try {

        const blockedEntries = await Phonebook.find({ status: 'BLOCKED' })
            .populate('user', 'name email')
            .populate({
                path: 'comments',
                populate: {
                    path: 'user',
                    select: 'name',
                }
            });

        res.status(200).json(blockedEntries);
    } catch (error) {
        console.error('Error fetching blocked phonebook entries:', error);
        res.status(500).json({ message: 'Error fetching blocked phonebook entries' });
    }
});
router.get('/get-leads-numbers', isAuth, async (req, res) => {
    try {
            const userId = req.user._id;
        const leadEntries = await Phonebook.find({ visibility: userId, calstatus: 'Convert to Lead' })
            .populate('user', 'name email')
            .populate('pipeline', 'name')
            .populate({
                path: 'comments',
                populate: {
                    path: 'user',
                    select: 'name',
                }
            });

        res.status(200).json(leadEntries);
    } catch (error) {
        console.error('Error fetching leads phonebook entries:', error);
        res.status(500).json({ message: 'Error fetching leads phonebook entries' });
    }
});
// router.get('/get-phonebook-by-pipeline',
//     isAuth,
//     hasRole(['HOD']),
//     async (req, res) => {
//         try {
//             console.log(req.user.pipeline);
//             const pipelineId = req.user.pipeline;

//             const phonebookEntries = await Phonebook.find({
//                 pipeline: pipelineId,
//                 // calstatus: { $ne: 'Convert to Lead' }
//             })
//                 .populate('user', 'name')
//                 .populate('pipeline', 'name')
//                 .populate({
//                     path: 'comments',
//                     populate: {
//                         path: 'user',
//                         select: 'name',
//                     }
//                 });

//             if (!phonebookEntries.length) {
//                 return res.status(404).json({ message: 'No phonebook entries found for this pipeline' });
//             }

//             res.status(200).json(phonebookEntries);
//         } catch (error) {
//             console.error('Error fetching phonebook entries by pipeline:', error);
//             res.status(500).json({ message: 'Error fetching phonebook entries by pipeline' });
//         }
//     });



module.exports = router;
