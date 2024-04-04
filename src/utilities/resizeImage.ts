export const resizeImage = async ({
  base64Image,
  height,
  width,
}: {
  base64Image: string;
  height: number | null;
  width: number | null;
}): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Image;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to create canvas context"));
        return;
      }

      canvas.width = width ?? img.width;
      canvas.height = height ?? img.height;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }

          const reader = new FileReader();
          reader.readAsArrayBuffer(blob);

          reader.onloadend = () => {
            if (reader.result instanceof ArrayBuffer) {
              resolve(new Uint8Array(reader.result) as Buffer);
            } else {
              reject(new Error("Failed to read array buffer"));
            }
          };
        },
        "image/png",
        0.6
      );
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
};
