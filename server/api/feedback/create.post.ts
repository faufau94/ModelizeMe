import prisma from "~/lib/prisma";
import { requireAuth } from "~/server/utils/auth";
import { createFeedbackSchema } from "~/server/validators";
import { sendFeedbackNotification } from "~/lib/send-invitation";

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);

  const body = await readBody(event);
  const { category, message } = createFeedbackSchema.parse(body);

  const feedback = await prisma.feedback.create({
    data: {
      category,
      message,
      userId: session.user.id,
    },
  });

  // Best-effort email notification - does not throw on failure
  await sendFeedbackNotification({
    userEmail: session.user.email,
    userName: session.user.name,
    category,
    message,
  });

  return feedback;
});
