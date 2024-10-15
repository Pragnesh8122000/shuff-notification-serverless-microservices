import mongoose from "mongoose";

export const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

export const newRequiredFieldsValidation = (requiredFields: string[], body: any) => {
    return requiredFields.filter((field) => {
        if (!(field in body) || body[field] === null) return true;
        let bodyField = body[field].toString();
        return bodyField.trim() === '';
    });
};

export const isString = (value: any) => typeof value === "string";
export const maxEmailLength = (value: string) =>
  value.length > 100 ? true : false;

export const isPositiveNumber = (value : number) =>
  typeof value === "number" && !isNaN(value) && value > 0;

export const isValidEnum = (object: any, input: any) => {
  return Object.values(object).includes(input)
}

export const isArray = (value: any) => Array.isArray(value);

export const validateIndianPhoneNumber = (phoneNumber: string) => {
  const regex = /^[1-9][0-9]{9}$/;
  return regex?.test(phoneNumber);
}

export const isValidUrl = (urlString: string) => {
  const url =
    /^(?:https?|http):\/\/(?:\S+(?::\S*)?@)?(?:(?!-)[A-Za-z0-9-]{1,63}(?:\.(?!-)[A-Za-z0-9-]{1,63})+|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[A-Za-z0-9-]{1,63})\])(?::\d{2,5})?(?:\/[^\s]*)?$/;
  return url.test(urlString);
};

export const isPassword = (value : string) => {
  // Password must be at least 8 characters long
  if (value.length < 8) {
    return false;
  }

  // Password must contain at least one uppercase letter
  if (!/[A-Z]/.test(value)) {
    return false;
  }

  // Password must contain at least one lowercase letter
  if (!/[a-z]/.test(value)) {
    return false;
  }

  // Password must contain at least one digit
  if (!/\d/.test(value)) {
    return false;
  }

  // Password can contain special characters, this checks for at least one
  if (!/[$@$!%*?&]/.test(value)) {
    return false;
  }

  // All criteria met, password is valid
  return true;
};

export const isMongoObjectId = (value : string) => {
  try {
    if (Array.isArray(value)) {
      return value.every((id) => {
        return (
          typeof mongoose !== "undefined" &&
          mongoose.Types.ObjectId.isValid(id)
        );
      });
    } else {
      return (
        typeof mongoose !== "undefined" &&
        mongoose.Types.ObjectId.isValid(value)
      );
    }
  } catch (error) {
    return false;
  }
};

export const isPhoneNumber = (value : string) => {
  return (
    /^[0-9]{1,3}(?:[\s_\-]?[0-9]){9}$/.test(value) &&
    value.replace(/[\s_\-]/g, "").length === 10
  );
};