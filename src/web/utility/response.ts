import enMessages from "../../common/languages/enMessages.json" assert { type: "json" };
import hiMessages from "../../common/languages/hiMessages.json" assert { type: "json" };


export const formatResponse = (
  success: number,
  statusCode: number,
  messageCode: keyof typeof enMessages,
  data?: unknown,
  replaceMsgObj = {}
) => {
  // let language = "en";
  const messages = enMessages;
  let message = messages[messageCode] || enMessages[messageCode];
  //only if replaceObj pass
  if (Object.keys(replaceMsgObj).length > 0) {
    message = replaceFieldText(message, replaceMsgObj)
  }
  if (data) {
    return {
      statusCode,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: success,
        message,
        data,
      }),
    };
  } else {
    return {
      statusCode,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success,
        message,
      }),
    };
  }
};

const replaceFieldText = (textMsg : string, replaceWith : any) => {
  if (Object.keys(replaceWith).length > 0) {
    for (const field in replaceWith) {
      if (replaceWith.hasOwnProperty(field)) {
        const regex = new RegExp("\\{" + field + "\\}", "g");
        textMsg = textMsg.replace(regex, replaceWith[field]);
      }
    }
  }
  return textMsg;
}