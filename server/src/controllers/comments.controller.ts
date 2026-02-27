import { Request, Response } from 'express';
import * as commentService from '../services/comment.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { CommentEntity } from '@expertmri/shared';

const VALID_ENTITY_TYPES = Object.values(CommentEntity);

function validateEntityType(type: string): type is CommentEntity {
  return VALID_ENTITY_TYPES.includes(type as CommentEntity);
}

export async function getComments(req: Request, res: Response): Promise<void> {
  const { entityType, entityId } = req.params;
  if (!validateEntityType(entityType)) {
    sendError(res, `Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
    return;
  }
  const comments = await commentService.getComments(entityType, entityId);
  sendSuccess(res, comments);
}

export async function addComment(req: Request, res: Response): Promise<void> {
  const { entityType, entityId } = req.params;
  if (!validateEntityType(entityType)) {
    sendError(res, `Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
    return;
  }
  const { text, parentCommentId } = req.body;
  const comment = await commentService.addComment(entityType, entityId, text, req.user!, parentCommentId);
  sendSuccess(res, comment, 'Comment added', 201);
}

export async function updateComment(req: Request, res: Response): Promise<void> {
  const { text } = req.body;
  const comment = await commentService.updateComment(req.params.commentId, text, req.user!);
  sendSuccess(res, comment, 'Comment updated');
}

export async function deleteComment(req: Request, res: Response): Promise<void> {
  await commentService.deleteComment(req.params.commentId, req.user!);
  sendSuccess(res, null, 'Comment deleted');
}
