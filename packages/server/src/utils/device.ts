import { Request } from 'express';

export interface DeviceInfo {
  ipAddress: string;
  userAgent: string;
  deviceName: string;
  deviceType: string;
  browser: string;
  os: string;
}

export function extractDeviceInfo(req: Request): DeviceInfo {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'unknown';

  const { deviceType, browser, os } = parseUserAgent(userAgent);

  const deviceName = `${browser} on ${os}`;

  return { ipAddress, userAgent, deviceName, deviceType, browser, os };
}

function parseUserAgent(ua: string) {
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let deviceType = 'desktop';

  if (/mobile|android|iphone|ipod/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    deviceType = 'tablet';
  }

  if (/chrome/i.test(ua) && !/edge|opr/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/edge/i.test(ua)) browser = 'Edge';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';

  if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac os/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

  return { deviceType, browser, os };
}

export function isSuspiciousLogin(
  current: DeviceInfo,
  recentLogins: { ipAddress: string; deviceType: string; browser: string }[],
): { suspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (recentLogins.length === 0) {
    return { suspicious: false, reasons };
  }

  const knownIPs = new Set(recentLogins.map((l) => l.ipAddress));
  if (!knownIPs.has(current.ipAddress)) {
    reasons.push('Login from new IP address');
  }

  const knownDevices = new Set(recentLogins.map((l) => `${l.deviceType}-${l.browser}`));
  const currentDevice = `${current.deviceType}-${current.browser}`;
  if (!knownDevices.has(currentDevice)) {
    reasons.push('Login from new device/browser');
  }

  const now = new Date();
  const hour = now.getHours();
  if (hour >= 1 && hour <= 5) {
    const nightLogins = recentLogins.filter((l) => {
      const loginHour = new Date(l.ipAddress).getHours();
      return loginHour >= 1 && loginHour <= 5;
    });
    if (nightLogins.length === 0) {
      reasons.push('Login at unusual hour');
    }
  }

  return { suspicious: reasons.length > 0, reasons };
}
