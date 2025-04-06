import ky from "ky";

export const addLocale = async (
  api: string,
  code: string,
  name: string,
  nativeName: string
) => {
  const response = await ky.post(api, { json: { code, name, nativeName } });

  if (!response.ok) {
    return false;
  }

  return true;
};
