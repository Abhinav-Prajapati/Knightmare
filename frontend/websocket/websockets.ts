import axios from "axios";

const newChallange = async (color: string) => {
  try {
    let response = await axios.post(
      `http://localhost:8080/create-challange`, // TODO replace env variable with actual server URL
      { color: color } // send player color as json body
    );
    return response.data;
  } catch (error) {
    console.error("Error creating new game:", error);
    return error;
  }
}
export default newChallange;

