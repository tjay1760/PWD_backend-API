"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const userSchema = new mongoose_1.Schema({
    full_name: {
        first: { type: String, required: true },
        middle: { type: String },
        last: { type: String, required: true }
    },
    national_id_or_passport: {
        type: String,
        required: true,
        unique: true
    },
    birth_certificate_number: {
        type: String,
        sparse: true // Only index if field exists
    },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female', 'other']
    },
    dob: {
        type: Date,
        required: true
    },
    contact: {
        phone: { type: String, required: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        }
    },
    marital_status: {
        type: String,
        enum: ['single', 'married', 'divorced', 'widowed', 'other']
    },
    occupation: { type: String },
    education_details: { type: String },
    county: { type: String, required: true },
    sub_county: { type: String, required: true },
    role: {
        type: String,
        required: true,
        enum: ['pwd', 'guardian', 'medical_officer', 'county_director', 'medical_approver', 'admin']
    },
    password_hash: { type: String, required: true },
    next_of_kin: {
        name: { type: String },
        relationship: { type: String },
        phone: { type: String }
    },
    guardian_for: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    medical_info: {
        license_number: { type: String },
        specialty: { type: String },
        county_of_practice: { type: String },
        approved_by_director: { type: Boolean, default: false }
    },
    director_info: {
        approved_medical_officers: [{
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            }]
    },
    system_admin_info: {
        permissions: [{ type: String }]
    },
    status: {
        type: String,
        required: true,
        enum: ['active', 'disabled'],
        default: 'active'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
// Indexes for performance
userSchema.index({ 'contact.email': 1 });
userSchema.index({ national_id_or_passport: 1 });
userSchema.index({ role: 1 });
userSchema.index({ county: 1, role: 1 });
exports.default = mongoose_1.default.model('User', userSchema);
