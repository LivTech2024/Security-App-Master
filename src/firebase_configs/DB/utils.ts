import { collection, doc } from "firebase/firestore";

import { db } from "../config";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { storage } from "../config";
import { resizeImage } from "../../utilities/resizeImage";

interface Image {
  path: string;
  base64: string;
}

export const getNewDocId = (collectionName: string) => {
  const collectionRef = collection(db, collectionName);

  const docRef = doc(collectionRef);

  return docRef.id;
};

class CloudStorageImageHandler {
  static generateImageName = (id: string, name: string) => {
    return `${id}_${name}.jpg`;
  };

  static deleteImageByUrl = (url: string) => {
    const imgRef = ref(storage, url);
    return deleteObject(imgRef);
  };

  static resizeImage = async (
    base64Image: string,
    width: number | null,
    height: number | null
  ) => {
    try {
      const imgBuffer = await resizeImage({
        base64Image,
        width,
        height,
      });
      return imgBuffer;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  static uploadImageAndGetUrl = async ({
    base64,
    imagePath,
    height,
    width,
  }: {
    base64: string;
    imagePath: string;
    height: number | null;
    width: number | null;
  }) =>
    new Promise<string>((resolve, reject) => {
      const storageReference1024 = ref(storage, imagePath);

      this.resizeImage(base64, width, height)
        .then((buffer) => {
          if (!buffer) {
            reject("Error resizing image");
            return;
          }

          uploadBytes(storageReference1024, buffer, {
            contentType: "image/jpeg",
          })
            .then((snapshot) => {
              getDownloadURL(snapshot.ref)
                .then((downloadURL) => {
                  resolve(downloadURL);
                })
                .catch((error) => {
                  console.log(error);
                  reject("Error while getting download url");
                });
            })
            .catch((error) => {
              console.log(error);
              reject("Error while uploading image");
            });
        })
        .catch((error) => {
          console.log(error);
          reject("Error resizing image");
        });
    });

  static getImageDownloadUrls = async (
    images: Image[],
    height: number | null,
    width: number | null
  ) => {
    //upload the images to cloud storage
    const promises = images.map((image) =>
      this.uploadImageAndGetUrl({
        base64: image.base64,
        imagePath: image.path,
        height,
        width,
      })
    );

    // might need to use settleAll here
    const promiseSettleResult = await Promise.allSettled(promises);

    // check if any of the image failed to get upload
    const imageUploadFailed = promiseSettleResult.some(
      (item) => item.status === "rejected"
    );

    if (imageUploadFailed) {
      //TODO: handle deletion of other resolution images
      // delete the images that got uploaded
      const deleteImagePromises = promiseSettleResult
        .filter((item) => item.status === "fulfilled")
        .map((item) => {
          if (item.status === "fulfilled") {
            return this.deleteImageByUrl(item.value);
          }
          return null;
        });

      await Promise.allSettled(deleteImagePromises).catch((error) => {
        //TODO: handle deletion failed here
        console.log(error);
      });
      throw new Error("Error uploading images");
    }

    return promiseSettleResult
      .map((item) => {
        if (item.status === "fulfilled") {
          return item.value;
        }
        return null;
      })
      .filter((item) => item !== null) as string[];
  };
}

export class CloudStorageFileHandler {
  static uploadFile = async (data: string, path: string) => {
    // Create a storage reference with a unique name
    const logRef = ref(storage, path);

    // Upload the log data as a blob
    const blob = new Blob([data], { type: "text/plain" });
    await uploadBytes(logRef, blob);
  };
}

export default CloudStorageImageHandler;
