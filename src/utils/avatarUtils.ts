export const getAvatarURL = (name: string = "User") => {
  
  const colors = ["2a62ff", "d24b33", "66bb6a", "ab47bc", "26a69a", "ffa726", "f36091",
                  "809ae3", "cfab1dde","16582f", "301763", "83dd35", "dd37fa", "f03333"
                 ]; 
                 
   
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
   hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }  
  
  const color = colors[Math.abs(hash) % colors.length];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&rounded=true&bold=true`;
}; 

