import { DeleteObjectCommand, GetObjectCommand, GetObjectCommandOutput, PutObjectCommand, PutObjectCommandInput, PutObjectCommandOutput, S3Client } from '@aws-sdk/client-s3';
// import { getFileUrlExistOnS3 } from "../s3Utils";
const maxFileSize = 3;
import dotenv from "dotenv";
dotenv.config();
import { v4 as uuidv4 } from 'uuid';
type ModelName = string;
type FieldName = string;
type UpdateTemplateData = any;
type FolderName = string;
type SettingField = string;
interface Data {
  [key: string]: any;
}
interface TemplateData {
    [key: string]: any;  // Flexible structure for template data
}
const regex = /^data:(image\/\w+);base64,/;


const s3 = new S3Client({
    credentials: {
      secretAccessKey: process.env.S3_SECRET_KEY as string,
      accessKeyId: process.env.S3_ACCESS_KEY as string,    
    },
    region: process.env.S3_REGION as string,               
});

export const checkFileSize = (buffer: Buffer): void => {
    const fileSizeInBytes = buffer.length;
    const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
  
    if (fileSizeInMB > maxFileSize) {
      throw new Error("File size too large.");
    }
};

export async function deleteImageFromS3(key: string): Promise<void> {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME as string, // Ensure process.env variable is typed as string
      Key: key,
    });
  
    try {
      const getResponse = await getFileUrlExistOnS3(key);
      if (getResponse) {
        await s3.send(deleteCommand);
        // logger.info(`Image with key ${key} deleted successfully from Amazon S3.`);
      }
    } catch (err: any) {
      if (err.name === 'NoSuchKey') {
        // logger.info(`No entry found for image with key ${key} in Amazon S3.`);
      } else {
        // logger.error("Error deleting image from Amazon S3: " + err);
        throw err;
      }
    }
}


  
export const handleImageUploadForCreate = async (
    image: string | string[],    
    fieldName: string,
    templateData: TemplateData,
    isArray: boolean,
    folderName: string,               
    settingField: string = ''
): Promise<void> => {
        try {
            if (image) {
            const imageData = isArray ? (image as string[])[0] : (image as string);
            const match = imageData.match(regex);
            
            if (match && match.length > 1) {
                const imageFileType = match[1];
                const base64Data = imageData.replace(regex, '');
                const buffer = Buffer.from(base64Data, 'base64');
                
                checkFileSize(buffer); 
                
                const imageUploadResult = await uploadToS3(buffer, imageFileType, folderName);
                const imageKey = imageUploadResult.key;
                const imageLink = `${imageKey}`;

                if (settingField !== '') {
                templateData[settingField] = imageLink;
                } else {
                templateData[fieldName] = imageLink;
                }
            } else {
                throw new Error("Invalid image data format");
            }
            }
        } catch (error) {
            // logger.error("Error occurred while executing handleImageUploadForCreate: " + error);
            throw new Error(`Invalid ${fieldName} Data`);
        }
};

export const uploadToS3 = async (
    fileData: Buffer,       // File data in Buffer format
    fileType: string,       // File MIME type (e.g., image/jpeg)
    folderName: string      // Folder name in the S3 bucket
  ): Promise<{ data: PutObjectCommandOutput, key: string }> => {
    try {
      const keyName = `${folderName}/${uuidv4()}.${fileType.split('/')[1]}`;
      const params: PutObjectCommandInput = {
        Bucket: process.env.S3_BUCKET_NAME || '',  // S3 bucket name from environment variables
        Key: keyName,
        Body: fileData,
        ContentType: fileType,
        ContentDisposition: 'inline',
      };
  
      const command = new PutObjectCommand(params);
      const data = await s3.send(command);  // Sending the PutObjectCommand to S3
      const key = params.Key || '';
  
      return { data, key };
    } catch (error) {
    //   logger.error("Error occurred while executing uploadToS3: " + error);
      throw error;
    }
};

export async function getFileUrlExistOnS3(key: string): Promise<boolean> {
    const getCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || '',  // Ensure Bucket is set, with fallback to an empty string
      Key: key,
    });
  
    try {
      const getResponse: GetObjectCommandOutput = await s3.send(getCommand);
      if (getResponse) {
        // logger.info(`File with key ${key} fetched successfully from Amazon S3.`);
        return true;
      } else {
        return false;
      }
    } catch (err) {
    //   logger.info(`No entry found for file with key ${key} in Amazon S3.`);
      return false;
    }
}

export const handleImageUploadForUpdate = async (
  data: Data,
  modelName: ModelName,
  image: string | undefined,
  fieldName: FieldName,
  templateData: UpdateTemplateData,
  isArray: boolean,
  folderName: FolderName,
  existingData: any,
  settingField: SettingField = ''
): Promise<void> => {
  try {
    if (image) {
      const match = image.match(regex);

      if (match && match.length > 1) {
        const base64Data = image.replace(regex, '');
        const buffer = Buffer.from(base64Data, 'base64');
        checkFileSize(buffer);
      }

      const currentImageLink: string = existingData[fieldName];
      if (currentImageLink && currentImageLink.length > 0) {
          await deleteImageFromS3(currentImageLink);
      }

      try {
        await handleImageUploadForCreate(image, fieldName, templateData, isArray, folderName, settingField);
      } catch (error) {
        throw new Error(`Invalid ${fieldName} Data`);
      }
    }
  } catch (error) {
    throw new Error(`Invalid ${fieldName} Data`);
  }
};