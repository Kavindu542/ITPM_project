import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function QRCodeGenerator({ meetingId, size = 220 }) {
  const value = React.useMemo(() => {
    const path = `/attendance/${encodeURIComponent(String(meetingId || ''))}`;
    if (typeof window === 'undefined') return path;
    return `${window.location.origin}${path}`;
  }, [meetingId]);

  if (!meetingId) return null;

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <QRCodeCanvas value={value} size={size} includeMargin />
      <div className="text-xs text-gray-600 break-all text-center">{value}</div>
    </div>
  );
}
