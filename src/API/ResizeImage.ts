import axios from 'axios';

const baseUrl = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:3000';

export const resizeImage = ({
  base64_image,
  height,
  width,
  max_size,
}: {
  base64_image: string;
  height?: number | null;
  width?: number | null;
  max_size?: number | null;
}) => {
  return axios.post(
    `${baseUrl}/api/compress_image`,
    {
      base64_image: base64_image.toString(),
      height,
      width,
      max_size: max_size ?? 200,
    },
    { responseType: 'blob' }
  );
};
