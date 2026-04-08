export default defineEventHandler(async () => {
  const response = await $fetch(process.env.URL_BACKEND + "/api/capabilities", {
    method: "GET",
  });

  return response;
});
