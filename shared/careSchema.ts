import { z } from 'zod'
export const careStartSchema = z.object({ mode: z.enum(['physical', 'emotional']).default('physical'), locale: z.enum(['es', 'en']).default('es') }).strict()

export const careAiOptionsSchema = z.object({
  modelConsent: z.boolean().default(false),
  historyConsent: z.boolean().default(false),
  dataConsent: z.boolean().default(false),
  monitoring: z.object({ sessionId: z.uuid(), token: z.string().regex(/^[a-f0-9]{64}$/) }).strict().optional(),
}).strict().refine(q => !q.monitoring || (q.modelConsent && q.dataConsent), 'Monitoring requires model and data consent')
export const careMessageSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  locale: z.enum(['es', 'en']).default('es'),
  ai: careAiOptionsSchema.default({ modelConsent: false, historyConsent: false, dataConsent: false }),
}).strict()
export const careDraftRequestSchema = careMessageSchema.omit({ text: true })
export const careApprovalSchema = z.object({
  body: z.string().trim().min(1).max(2000), shareWith: z.string().min(1).max(100).nullable().default(null),
  expectedMessages: z.number().int().nonnegative().optional(),
}).strict()
export const careMessageRecordSchema = z.object({
  role: z.enum(['user', 'assistant']), text: z.string(), at: z.number(),
  source: z.enum(['model', 'local']).optional(), model: z.string().optional(), notice: z.string().optional(),
  sources: z.array(z.string()).optional(), toolsUsed: z.array(z.object({ name: z.string(), status: z.string() })).optional(),
})
export const careConversationSchema = z.object({
  id: z.string(), missionId: z.string(), profileId: z.string(), mode: z.enum(['physical', 'emotional']),
  private: z.boolean(), messages: z.array(careMessageRecordSchema), createdAt: z.number(), updatedAt: z.number(),
})
export const careDraftSchema = z.object({
  text: z.string().min(1).max(2000), source: z.enum(['model', 'local']), model: z.string().optional(),
  notice: z.string().optional(), expectedMessages: z.number().int().nonnegative(),
}).strict()
export type CareAiOptions = z.infer<typeof careAiOptionsSchema>
export type CareConversation = z.infer<typeof careConversationSchema>
export type CareDraft = z.infer<typeof careDraftSchema>
