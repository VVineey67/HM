import React, { useState } from 'react';
import { 
  Info, 
  Search, 
  Users
} from 'lucide-react';

export default function About() {
  const [activeTab, setActiveTab] = useState('Our Leadership Team');
  const [searchQuery, setSearchQuery] = useState('');

  // Leadership Team Data
  const leadershipTeam = [
    { name: "Deepak Rai", role: "Founder & Managing Director", img: "/Deepak-rai-Final-image.png" },
    { name: "Manab Rakshit", role: "Director – Strategy", img: "/Manab Rakshit.png" },
    { name: "Oliver Pilapil", role: "Technical Director", img: "/Oliver Pilapil.png" },
    { name: "Imad Agi", role: "Sustainability Head", img: "/Imad Agi.png" },
    { name: "Vishal Agarwal", role: "Director", img: "/Vishal Agarwal.png" },
    { name: "Shubhi Agarwal", role: "Head – Marketing & Sales", img: "/shubhi-agarwal.png" },
    { name: "Janveer Singh (Kaifu)", role: "International Director", img: "/Janveer Singh (Kaifu).png" },
    { name: "Gurdarshan S Kochar", role: "Vice President, Real Estate", img: "/Gurdarshan S Kochar.png" },
  ];

  // Monitoring Team Data
  const teamMembers = [
    { name: "Harshit Jain", role: "Manager", dept: "Management", img: "" },
    { name: "Rohan Srivastava", role: "Software Developer", dept: "Engineering", img: "/Rohan Srivastava.jpeg" },
    { name: "Jitendar Goyal", role: "Data Analyst", dept: "Engineering", img: "" },
    { name: "Mohammad Kashif Mansoorie", role: "Team Lead", dept: "Management", img: "" },
    { name: "Abhishek Kumar ", role: "Manager", dept: "On-Site Staff", img: "/Abhishek Kumar.jpeg" },
  ];

  const categories = ["Our Leadership Team", "All", "Engineering", "Management", "On-Site Staff"];

  // Search and Filter Logic
  const getFilteredData = () => {
    let baseData = [];
    if (activeTab === 'All') {
      baseData = teamMembers;
    } else if (activeTab !== "Our Leadership Team") {
      baseData = teamMembers.filter(m => m.dept === activeTab);
    }

    if (searchQuery) {
      return baseData.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return baseData;
  };

  const filteredTeam = getFilteredData();

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
      {/* Header Section */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-slate-800 flex items-center justify-center md:justify-start gap-3">
          <Info className="text-blue-600" size={36} />
          BOOTES Monitoring System
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Empowering Projects, Building Future</p>
      </div>

      {/* Hero Banner Area */}
      <div className="relative w-full h-64 md:h-80 rounded-3xl overflow-hidden mb-12 shadow-2xl group">
        <img 
          src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop" 
          alt="Construction Site" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-center px-10 text-white">
          <h2 className="text-4xl font-bold mb-3 tracking-tight text-white">Our Strength, Our People</h2>
          <p className="max-w-md text-slate-200 text-lg leading-relaxed">
            Meet the dedicated visionaries behind the innovative BOOTES Monitoring System.
          </p>
        </div>
      </div>

      {/* Tabs Navigation & Search Bar */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-gray-200 pb-6">
        <div className="flex gap-3 overflow-x-auto w-full md:w-auto no-scrollbar py-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveTab(cat); setSearchQuery(''); }}
              className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                activeTab === cat 
                ? 'bg-blue-700 text-white shadow-md' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {activeTab !== "Our Leadership Team" && (
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search team member..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-white shadow-sm outline-none"
            />
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      {activeTab === "Our Leadership Team" ? (
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">Our Leadership Team</h2>
            <p className="text-slate-600 max-w-2xl mx-auto italic">
              "Accelerating India's transition towards Net-Zero & Aatmanirbhar Future."
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {leadershipTeam.map((leader, index) => (
              <div key={index} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 group">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-slate-50 ring-2 ring-blue-100 group-hover:ring-blue-400">
                  <img src={leader.img} alt={leader.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }} />
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-1">{leader.name}</h4>
                <p className="text-blue-600 text-sm font-semibold mb-6 h-10 flex items-center">{leader.role}</p>
                <button className="bg-slate-50 text-slate-700 px-6 py-2 rounded-full text-xs font-bold tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-slate-200">
                  KNOW MORE
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* TEAM CARDS STYLE (AS REQUESTED) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredTeam.map((member, index) => (
            <div key={index} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              {/* Image Header with Light Blue Background */}
              <div className="relative h-48 bg-[#eef4ff] flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-4 border-blue-500 overflow-hidden bg-white">
                  {member.img ? (
                    <img 
                      src={member.img} 
                      alt={member.name}
                      className="w-full h-full object-cover" // Grayscale filter removed
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50">
                       <Users size={40} className="text-blue-200" />
                    </div>
                  )}
                </div>
                {/* Green Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white"></span>
                </div>
              </div>

              {/* Text Info Section */}
              <div className="p-5">
                <h4 className="text-lg font-bold text-slate-800">{member.name}</h4>
                <p className="text-blue-600 text-[11px] font-black uppercase mb-4 tracking-tight">{member.role}</p>
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    {member.dept}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}