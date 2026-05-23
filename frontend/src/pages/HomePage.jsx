import { useChatStore } from "../store/useChatStore.js";
import Sidebar from "../components/chat/Sidebar.jsx";
import ChatWindow from "../components/chat/ChatWindow.jsx";
import NoChatSelected from "../components/chat/NoChatSelected.jsx";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {selectedUser ? <ChatWindow /> : <NoChatSelected />}
      </main>
    </div>
  );
};

export default HomePage;
