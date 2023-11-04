import ky from "ky";

const skinportApi = ky.extend({ prefixUrl: "https://api.skinport.com" });

export default skinportApi;
