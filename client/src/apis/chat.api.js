import API from "./api";  // ← your fixed API utility

export const sendMessage = (payload) =>
  API("/chat/chat", {
    method: "POST",
    body: payload,   // { message, userId }
  });

export const getChatHistory = (userId) =>
  API(`/chat/${userId}`);

export const deleteChatHistory = (userId) =>
  API(`/chat/${userId}`, { method: "DELETE" });