import { type CourseDto } from '@repo/shared/validations';
import { type AttachmentDto } from '@repo/shared/contracts';
import { type Attachment } from '@modules/material/material.schema';
import { type CourseDocument } from './course.schema';

const toAttachmentDto = (attachment: Attachment & { _id?: unknown }): AttachmentDto => ({
  _id: String(attachment._id ?? ''),
  fileName: attachment.fileName,
  url: attachment.url,
  documentType: attachment.documentType,
  fileType: attachment.fileType,
  fileExtension: attachment.fileExtension,
  linkType: attachment.linkType ?? null,
  reference: attachment.reference,
  tag: attachment.tag,
  isUploaded: attachment.isUploaded,
});

/**
 * Converts a course document to its wire contract. The only place that knows about ObjectId and
 * Date for this entity. Listing every field explicitly keeps `_deleted`, `__v` and any field added
 * later out of the response.
 */
export const toCourseDto = (course: CourseDocument): CourseDto => ({
  _id: course._id.toString(),
  _deleted: course._deleted ?? false,
  org: course.org.toString(),
  createdBy: course.createdBy?.toString(),
  updatedBy: course.updatedBy?.toString(),
  createdAt: course.createdAt?.toISOString(),
  updatedAt: course.updatedAt?.toISOString(),
  name: course.name,
  slug: course.slug,
  description: course.description,
  thumbnail: course.thumbnail,
  status: course.status,
  tag: course.tag,
  order: course.order,
  isPublished: course.isPublished ?? false,
  publishedDate: course.publishedDate?.toISOString(),
  standards: (course.standards ?? []).map(String),
  subjects: (course.subjects ?? []).map(String),
  courses: (course.courses ?? []).map(String),
  meets: (course.meets ?? []).map(String),
  attachments: (course.attachments ?? []).map(toAttachmentDto),
  stats: course.stats,
});
