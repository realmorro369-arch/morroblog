import tls from "node:tls";
import { afterAll, describe, expect, it } from "vitest";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? "465");
const username = process.env.SMTP_USER;
const password = process.env.SMTP_PASS;
const describeSmtpIntegration = process.env.RUN_SMTP_INTEGRATION === "true" ? describe : describe.skip;

function verifySmtpLogin(): Promise<string> {
  if (!host || !username || !password) {
    return Promise.reject(new Error("SMTP environment variables are missing"));
  }

  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: true });
    let buffer = "";
    let stage: "greeting" | "ehlo" | "auth" | "username" | "password" | "done" = "greeting";
    const timeout = setTimeout(() => fail(new Error("SMTP verification timed out")), 15_000);

    const fail = (error: Error) => {
      clearTimeout(timeout);
      socket.destroy();
      reject(error);
    };

    const send = (command: string) => socket.write(`${command}\r\n`);

    socket.setEncoding("utf8");
    socket.once("error", fail);
    socket.on("data", (chunk: string) => {
      buffer += chunk;
      const completeResponse = /\r?\n\d{3} /.test(buffer) || /^\d{3} /.test(buffer);
      if (!completeResponse) return;

      const response = buffer;
      buffer = "";
      const code = response.match(/(?:^|\r?\n)(\d{3})[ -]/)?.[1];

      if (stage === "greeting" && code === "220") {
        stage = "ehlo";
        send("EHLO morroblog.local");
      } else if (stage === "ehlo" && code === "250") {
        stage = "auth";
        send("AUTH LOGIN");
      } else if (stage === "auth" && code === "334") {
        stage = "username";
        send(Buffer.from(username).toString("base64"));
      } else if (stage === "username" && code === "334") {
        stage = "password";
        send(Buffer.from(password).toString("base64"));
      } else if (stage === "password" && code === "235") {
        stage = "done";
        clearTimeout(timeout);
        send("QUIT");
        resolve(response);
      } else if (code && Number(code) >= 400) {
        fail(new Error(`SMTP authentication failed with ${code}`));
      }
    });
  });
}

describeSmtpIntegration("163 SMTP credentials", () => {
  it("authenticates over TLS without sending a message", async () => {
    await expect(verifySmtpLogin()).resolves.toContain("235");
  }, 20_000);
});

afterAll(() => {
  // Credentials remain in environment variables only; tests never print them.
});
