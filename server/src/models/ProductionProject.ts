import { Schema, model, Document, Types } from 'mongoose';
import { PostStatus, ProjectCategory } from '@expertmri/shared';

export interface IPrintReadyFile {
  s3Key: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

export interface IProductionProject extends Document {
  category: ProjectCategory;
  projectName: string;
  type: string;
  subject: string;
  description: string;
  link?: string;
  monthKey?: string;
  status: PostStatus;
  thumbnailUrl?: string;
  printReadyFile?: IPrintReadyFile;
  mediaUrls: string[];
  createdBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const printReadyFileSchema = new Schema<IPrintReadyFile>(
  {
    s3Key: { type: String, required: true },
    url: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const productionProjectSchema = new Schema<IProductionProject>(
  {
    category: { type: String, enum: Object.values(ProjectCategory), required: true, index: true },
    projectName: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    subject: { type: String, default: '' },
    description: { type: String, default: '' },
    link: { type: String },
    monthKey: { type: String, index: true },
    status: {
      type: String,
      enum: Object.values(PostStatus),
      default: PostStatus.DRAFT,
      index: true,
    },
    thumbnailUrl: { type: String },
    printReadyFile: { type: printReadyFileSchema },
    mediaUrls: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

productionProjectSchema.index({ category: 1, status: 1 });
productionProjectSchema.index({ category: 1, monthKey: 1 });

export const ProductionProject = model<IProductionProject>(
  'ProductionProject',
  productionProjectSchema
);
