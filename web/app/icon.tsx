import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

/*
  The same four-pointed sparkle as the wordmark (components/sparkle.tsx), baked
  at the shipped palette's dark values. A favicon is a single raster and cannot
  follow `?palette=`, so it commits to the default.
*/
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0b0d',
          borderRadius: 7,
          border: '1px solid #232120',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#e0b567">
          <path d="M12 1C12 7.075 16.925 12 23 12C16.925 12 12 16.925 12 23C12 16.925 7.075 12 1 12C7.075 12 12 7.075 12 1Z" />
        </svg>
      </div>
    ),
    size,
  );
}
