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
const assessmentSchema = new mongoose_1.Schema({
    pwd_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requested_by: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['not_booked', 'pending_review', 'mo_review', 'director_review', 'approved', 'rejected'],
        default: 'not_booked'
    },
    form_type: {
        type: String,
        required: true,
        enum: ['MOH-276A', 'MOH-276B', 'MOH-276C', 'MOH-276D', 'MOH-276E', 'MOH-276F', 'MOH-276G']
    },
    medical_officer_entries: [{
            officer_id: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            form_data: {
                type: mongoose_1.Schema.Types.Mixed,
                required: true
            },
            uploaded_reports: [{ type: String }],
            comments: { type: String },
            digital_signature: { type: Boolean, default: false },
            submitted_at: { type: Date, default: Date.now },
            reviewed: { type: Boolean, default: false },
            review_comments: { type: String },
            approved: { type: Boolean }
        }],
    director_review: {
        director_id: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        },
        comments: { type: String },
        approved: { type: Boolean },
        signed_at: { type: Date }
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
assessmentSchema.index({ pwd_id: 1 });
assessmentSchema.index({ status: 1 });
assessmentSchema.index({ 'medical_officer_entries.officer_id': 1 });
assessmentSchema.index({ 'director_review.director_id': 1 });
exports.default = mongoose_1.default.model('Assessment', assessmentSchema);
