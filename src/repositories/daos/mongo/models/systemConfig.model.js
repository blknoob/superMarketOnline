import mongoose from "mongoose";

const configSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: "system_config",
  timestamps: true
});

const SystemConfig = mongoose.model("SystemConfig", configSchema);

export default SystemConfig;