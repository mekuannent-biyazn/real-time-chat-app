import { useChatStore } from "../store/useChatStore.js";
import Sidebar from "../components/chat/Sidebar.jsx";
import ChatWindow from "../components/chat/ChatWindow.jsx";
import NoChatSelected from "../components/chat/NoChatSelected.jsx";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen flex overflow-hidden">
      {/*
        Mobile: show sidebar when no user selected, show chat when user selected
        Desktop: always show both side by side
      */}
      <div
        className={`
          ${selectedUser ? "hidden md:flex" : "flex"}
          w-full md:w-80 flex-shrink-0
        `}
      >
        <Sidebar />
      </div>

      <main
        className={`
          ${selectedUser ? "flex" : "hidden md:flex"}
          flex-1 flex-col min-w-0
        `}
      >
        {selectedUser ? <ChatWindow /> : <NoChatSelected />}
      </main>
    </div>
  );
};

export default HomePage;
