import { promises as fs } from "fs";
import path from "path";

function getDirPath() {
  const base =
    process.env.VERCEL === "1" || process.env.VERCEL === "true"
      ? "/tmp"
      : process.cwd();
  return path.join(base, ".mp-processed");
}

export async function acquirePaymentDeliveryOnce(paymentId: string): Promise<boolean> {
  const safeId = paymentId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const dir = getDirPath();
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${safeId}.done`);

  try {
    const handle = await fs.open(filePath, "wx");
    await handle.writeFile(String(Date.now()), { encoding: "utf8" });
    await handle.close();
    console.log(`[idempotency] ✅ Pagamento ${paymentId} marcado como processado`);
    return true;
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "EEXIST") {
      console.log(`[idempotency] ℹ️ Pagamento ${paymentId} já estava processado`);
      return false;
    }
    throw err;
  }
}

export async function isPaymentProcessed(paymentId: string): Promise<boolean> {
  const safeId = paymentId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filePath = path.join(getDirPath(), `${safeId}.done`);
  
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function acquirePaymentEmailSendLock(paymentId: string): Promise<boolean> {
  const safeId = paymentId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const dir = getDirPath();
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${safeId}.email.lock`);

  try {
    const handle = await fs.open(filePath, "wx");
    await handle.writeFile(String(Date.now()), { encoding: "utf8" });
    await handle.close();
    return true;
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "EEXIST") {
      return false;
    }
    throw err;
  }
}

export async function releasePaymentEmailSendLock(paymentId: string): Promise<void> {
  const safeId = paymentId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filePath = path.join(getDirPath(), `${safeId}.email.lock`);
  try {
    await fs.unlink(filePath);
  } catch {
    return;
  }
}

export async function getPaymentEmailSendLockAgeMs(paymentId: string): Promise<number | null> {
  const safeId = paymentId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filePath = path.join(getDirPath(), `${safeId}.email.lock`);
  try {
    const content = await fs.readFile(filePath, { encoding: "utf8" });
    const ts = Number(content.trim());
    if (!Number.isFinite(ts)) return null;
    return Date.now() - ts;
  } catch {
    return null;
  }
}
