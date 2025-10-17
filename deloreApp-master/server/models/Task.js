const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Title must contain total hours as numbers (e.g., "Task Name 8", "Project Work 4.5")
          const hoursMatch = v.match(/\d+(\.\d+)?/);
          return hoursMatch !== null;
        },
        message:
          'Title must include total hours as numbers (e.g., "Task Name 8" or "Project Work 4.5")',
      },
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledStartTime: {
      type: Date,
      required: true,
    },
    scheduledEndTime: {
      type: Date,
      required: true,
    },
    totalHours: {
      type: Number,
      required: true,
      min: [0.1, "Total hours must be at least 0.1"],
      validate: {
        validator: function (v) {
          return v > 0;
        },
        message: "Total hours must be greater than 0",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    clockInTime: {
      type: Date,
      default: null,
    },
    clockOutTime: {
      type: Date,
      default: null,
    },
    workSummary: {
      type: String,
      trim: true,
      default: "",
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    adminOverride: {
      clockIn: {
        type: Boolean,
        default: false,
      },
      clockOut: {
        type: Boolean,
        default: false,
      },
      reason: {
        type: String,
        default: "",
      },
    },
    hoursSpent: {
      type: Number,
      default: 0,
    },
    attachmentFilename: {
      type: String,
      required: true,
    },
    attachmentOriginalName: {
      type: String,
      required: true,
    },
    attachmentPath: {
      type: String,
      required: true,
    },
    attachmentSize: {
      type: Number,
      required: true,
    },
    attachmentMimeType: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Extract total hours from title for validation consistency
taskSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    const hoursMatch = this.title.match(/\d+(\.\d+)?/);
    if (hoursMatch) {
      const extractedHours = parseFloat(hoursMatch[0]);
      // Optionally sync the totalHours field with the hours in the title
      // Uncomment the next line if you want automatic sync
      // this.totalHours = extractedHours;
    }
  }
  next();
});

module.exports = mongoose.model("Task", taskSchema);
