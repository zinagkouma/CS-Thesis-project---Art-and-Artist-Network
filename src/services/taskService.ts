import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/api/tasks';

export const getTasks = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};
