import React, {useEffect, useState, useRef} from 'react';
import {useAuth} from '../../context/AuthContext';
import {useLocation} from 'react-router-dom';
import {getAvatarURL} from '../../utils/avatarUtils';
import EmojiPicker from 'emoji-picker-react';

import sendIcon from '../../assets/icons/send.png'; 
import {FaSmile, FaFlag} from 'react-icons/fa';

import './ChatPage.css';



interface Conversation {
  conversationId: string;
  otherUser: {
    _id: string;
    username: string;
    avatar: string;
  } 
  lastMessage: string;
  updatedAt: string;
  unreadCount: number; 
}

interface Message {
  _id: string;
  sender: string;
  text: string;
  createdAt: string; 
  seen: boolean;   
}


const ChatPage: React.FC = () => {
  const {user, authHeader} = useAuth(); 
  const location = useLocation(); 
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentChat, setCurrentChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const [showPicker, setShowPicker] = useState(false); 

  const [reportModal, setReportModal] = useState<{show: boolean, msgId: string | null}>({
    show: false,
    msgId: null
  });
  const [reportReason, setReportReason] = useState("Harassment");

  const scrollRef = useRef<HTMLDivElement>(null);


  //Load friends and conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
     const res = await fetch("http://localhost:5000/api/chat", 
       {headers: authHeader()}
     );
     
     const data = await res.json();
     setConversations(data);

    } catch (err) {
      console.error(err); 
    }
  };


  //Load messages for a selected chat 
  useEffect(() => {
    if (currentChat) {
      //Logic for empty (virtual) chat
      if (currentChat.conversationId.startsWith("virtual_")) {
        setMessages([]);
        return;
      }

      const fetchMessages = async () => {
        const res = await fetch(`http://localhost:5000/api/chat/${currentChat.conversationId}`,{
          headers: authHeader()
        });

          const data = await res.json();
          setMessages(data);

          markAsRead(currentChat.conversationId);
        
      }; 

      fetchMessages();
    }
  }, [currentChat]);


  /*Open existing conversation or create a temporary virtual chat,
  depending on if other user is a friend*/ 
  useEffect(() => {
    const newContact = location.state?.startChatWith;

    if (newContact) {
      setConversations(prev => {
        const existingChat = prev.find(c => c.otherUser._id === newContact._id);

        if (existingChat) {
          setCurrentChat(existingChat);
          return prev;
        }

        const virtualChat: Conversation = {
          conversationId: `virtual_${newContact._id}`,
          otherUser: {
            _id: newContact._id,
            username: newContact.username,
            avatar: newContact.avatar || ""
          },
          lastMessage: "",
          updatedAt: new Date().toISOString(),
          unreadCount: 0
        };

        setCurrentChat(virtualChat);
        return [virtualChat, ...prev];
      });

      // Clear location state 
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);


  //Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  //Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentChat) return;
     try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          conversationId: currentChat.conversationId,
          receiverId: currentChat.otherUser._id,
          text: newMessage
        })
      });  

      const data = await res.json();

      if (currentChat.conversationId.startsWith("virtual_")) {
        const realId = data.realConversationId;
        
        const updatedChat = {...currentChat, conversationId: realId, lastMessage: newMessage};
        setCurrentChat(updatedChat);

        //Update conversation list
        setConversations(prev => prev.map(c => 
          c.conversationId === currentChat.conversationId ? updatedChat : c
        ));
      }

      setMessages([...messages, data]);
      setNewMessage("");

      //Update "last message" preview
      fetchConversations();

     } catch (err) {
       console.error(err);
     }
  };


  //Mark messages as read
  const markAsRead = async (chatId: string) => {
    if (chatId.startsWith("virtual_")) return;

    try {
     await fetch(`http://localhost:5000/api/chat/${chatId}/read`, {
       method: "PUT",
       headers: authHeader()
     });
     
    } catch (err) {
      console.error(err); 
    }
  };

    
  //Clear unread count when clicking a chat 
  const handleChatClick = (c: Conversation) => {
    setCurrentChat(c);

    if (c.unreadCount > 0) {
      setConversations(prev => prev.map(convo =>
       convo.conversationId === c.conversationId
            ? {...convo, unreadCount:0}
            : convo 
      ));
    }
  };
  

  //Handle emoji selection
  const handleEmojiClick = (emojiObject: any) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };


  //Handle report submission
  const handleReportSubmit = async () => {
    if (!reportModal.msgId) return;

    const targetMessage = messages.find(m => m._id === reportModal.msgId);
    if (!targetMessage) return;

    try {
     const res = await fetch("http://localhost:5000/api/reports", {
       method: "POST",
       headers: {
        "Content-Type": "application/json",
        ...authHeader()
       },
       body: JSON.stringify({
        reportedItem: reportModal.msgId,
        reportedUser: targetMessage.sender,
        itemType: "Message",
        reason: reportReason
       })
     }); 

     if (res.ok) {
       alert("Report submitted for review");
       setReportModal({show: false, msgId: null});

     } else {
       alert("Failed to report message");
     }

    } catch (err) {
      console.error(err); 
    }
  };

 
  return (
    <div className='messenger'>

      {/*Left: The sidebar*/}
      <div className='chatMenu'>
        <div className='chatMenu-wrapper'>
           <h3>Messages</h3>

           {conversations.map((c) => (
             <div
              key={c.conversationId}
              className={`conversation ${currentChat?.conversationId === c.conversationId ? 'active' : ''}`}
              onClick={() => handleChatClick(c)}
             >
               <img
                className='conversation_img'
                src={c.otherUser.avatar || getAvatarURL(c.otherUser?.username)}
                alt={c.otherUser.username}
               /> 

               <div className='conversation_info'>
                 <span className='conversation_name'>
                  {c.otherUser?.username}
                 </span>

                <div className='conversation_details'>
                 <span className={`conversation_preview ${c.unreadCount > 0 ? 'bold' : ''}`}>
                  {c.conversationId.startsWith("virtual_")
                     ? <i style={{color: '#aaa'}}>Start a conversation</i>
                     : c.lastMessage?.substring(0, 20) + "..."
                  }
                 </span>

                 {/*Unread messages badge*/}
                 {c.unreadCount > 0 && (
                   <span className="chat_unread-badge">
                    {c.unreadCount}
                   </span>
                 )}
                </div>
               </div>
             </div>

           ))} 

        </div>
      </div> 


      {/*Right: Chat box*/} 
      <div className='chatBox'>
        <div className='chatBox-wrapper'>

          {currentChat ? (
           <>

            <div className='chatBox_top'>

             {messages.length === 0 ? (
                <div style={{textAlign: 'center', marginTop: '50px', color: '#7c7c7c'}}>
                  Say hello to {currentChat.otherUser.username}! 👋
                </div>
             ) : (
               <>
               {messages.map((m) => (
                <div key={m._id} className={`message ${m.sender === user?.id ? "own" : ""}`}>
                  <div className='message_top'>
                    <p className='message_text'>{m.text}</p>

                    {/*Report button*/}
                    {m.sender !== user?.id && (
                      <button
                       className='report-btn'
                       title='Report this message'
                       onClick={() => setReportModal({show: true, msgId: m._id})}
                      >
                        <FaFlag size={12}/> 
                      </button>
                    )}
                  </div>

                  <div className='message_bottom'>
                    {new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}

                    {m.sender === user?.id && (
                      <span className={`message_status ${m.seen ? "seen" : "sent"}`}>
                        {m.seen ? " ✓✓" : " ✓"}
                      </span>
                    )}

                  </div>
                </div>
              ))}

              <div ref={scrollRef} />
             </> 
             )}  
            </div>

            <div className='chatBox_bottom'>
               
              {showPicker && (
               <div className='emoji_picker-container'>
                <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} />
               </div> 
              )}

              <form className='chatForm' onSubmit={handleSend}>
                <button
                 type='button'
                 className='emoji-btn'
                 onClick={() => setShowPicker(!showPicker)}
                >
                 <FaSmile className="emoji-icon"/>
                </button>
                
                <input
                 className='chat_message-input'
                 placeholder='Your message'
                 value={newMessage}
                 onChange={(e) => setNewMessage(e.target.value)}
                 onFocus={() => setShowPicker(false)}
                />

                <button className='chat_submit' type='submit'>
                  <img src={sendIcon} alt="" className="send-icon" />
                </button>
              </form>  
            </div>

           </>
          ) : (   
            <span className="noConversationText">Open a conversation to start a chat</span>
          )}  

        </div>
      </div>

      {/*Report modal*/}
      {reportModal.show && (
        <div className="modal_backdrop">
         <div className="modal_content">
          <h3>Report Message</h3>
          <p className="report_text">Why are you reporting this?</p>

          <select
           className="report_reason"
           value={reportReason}
           onChange={(e) => setReportReason(e.target.value)}
          >
            <option value="Harassment">Harassment</option>
            <option value="Spam">Spam</option>
            <option value="Inappropriate Content">Inappropriate Content</option>
            <option value="Hate Speech">Hate Speech</option>
            <option value="Other">Other</option>
          </select>

          <div className="report_actions">
            <button 
             className="report_cancel"
             onClick={() => setReportModal({show: false, msgId: null})}
            >
             Cancel
            </button>

            <button
             className="report_submit"
             onClick={handleReportSubmit}
            >
             Report 
            </button>
          </div>

         </div> 
        </div>
      )} 


    </div>
  );

};


export default ChatPage; 