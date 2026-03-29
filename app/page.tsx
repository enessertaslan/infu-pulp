"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

type Influencer = {
  id: string;
  name: string;
  link?: string;
  channel: string;
  geo?: string;
  lang?: string;
  followers?: number;
  campaign?: string;
  avgviews?: number;
  erpost?: number;
  vrpost?: number;
  erview?: number;
  price1?: number;
  price3?: number;
  price5?: number;
  extraCampaigns?: { name: string; price?: number }[];
};

type ListItem = { id: string; name: string; members: string[] };

const CHANNELS = ["Instagram", "YouTube", "TikTok", "Twitter", "Telegram", "Facebook"];

const chClass = (ch?: string) => ({
  Instagram: "ch-ig",
  YouTube: "ch-yt",
  TikTok: "ch-tt",
  Twitter: "ch-tw",
  Facebook: "ch-fb",
  Telegram: "ch-tg",
}[ch || ""] || "");

const chIcon = (ch?: string) => ({
  Instagram: "📸",
  YouTube: "▶",
  TikTok: "♪",
  Twitter: "✕",
  Facebook: "f",
  Telegram: "✈",
}[ch || ""] || "◉");

const fmtNum = (n?: number) => {
  if (!n && n !== 0) return "—";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return String(n);
};

const fmtPrice = (n?: number) => (n || n === 0 ? `$${n.toLocaleString()}` : "—");

const erClass = (v?: number) => {
  if (v === undefined || v === null || Number.isNaN(Number(v))) return "";
  if (v >= 5) return "er-high";
  if (v >= 2) return "er-mid";
  return "er-low";
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export default function Home() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"all" | "list" | "channel">("all");
  const [influencers, setInfluencers] = useState<Influencer[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const data = window.localStorage.getItem("influx_v2");
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  });

  const [lists, setLists] = useState<ListItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const data = window.localStorage.getItem("influx_lists_v2");
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  });

  const [currentViewData, setCurrentViewData] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [exportScope, setExportScope] = useState<"current" | "all">("current");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);

  const [form, setForm] = useState<Partial<Influencer>>({ channel: "" });
  const [extraCampaigns, setExtraCampaigns] = useState<{ name: string; price?: number }[]>([]);

  const [toast, setToast] = useState<{ text: string; icon: string; active: boolean }>({ text: "", icon: "", active: false });

  useEffect(() => {
    localStorage.setItem("influx_v2", JSON.stringify(influencers));
  }, [influencers]);

  useEffect(() => {
    localStorage.setItem("influx_lists_v2", JSON.stringify(lists));
  }, [lists]);

  useEffect(() => {
    if (!toast.active) return;
    const id = window.setTimeout(() => setToast((prev) => ({ ...prev, active: false })), 2200);
    return () => clearTimeout(id);
  }, [toast.active]);

  const toastShow = (text: string, icon = "✓") => setToast({ text, icon, active: true });

  const filtered = useMemo(() => {
    let data = [...influencers];
    if (currentView === "list" && currentViewData) {
      const list = lists.find((x) => x.id === currentViewData);
      data = list ? influencers.filter((i) => list.members.includes(i.id)) : [];
    }
    if (currentView === "channel" && currentViewData) {
      data = data.filter((i) => i.channel === currentViewData);
    }
    if (filterChannel) data = data.filter((i) => i.channel === filterChannel);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((i) =>
        [i.name, i.geo, i.lang, i.channel, i.campaign].some((v) => (v || "").toLowerCase().includes(q)),
      );
    }
    return data;
  }, [influencers, lists, currentView, currentViewData, filterChannel, search]);

  const stats = useMemo(() => {
    const tf = filtered.reduce((sum, i) => sum + Number(i.followers || 0), 0);
    const validEr = filtered.filter((i) => i.erpost !== undefined && i.erpost !== null).map((i) => Number(i.erpost));
    const ae = validEr.length ? Number(validEr.reduce((sum, v) => sum + v, 0) / validEr.length).toFixed(2) : "";
    const tb = filtered.reduce((sum, i) => sum + Number(i.price1 || 0), 0);
    return { total: filtered.length, tf, aveER: ae, totalPrice1: tb };
  }, [filtered]);

  const updateCounts = () => {
    const counts: Record<string, number> = { all: influencers.length };
    CHANNELS.forEach((ch) => {
      counts[ch] = influencers.filter((i) => i.channel === ch).length;
    });
    return counts;
  };

  const counts = updateCounts();

  const setView = (type: "all" | "list" | "channel", data?: string) => {
    setCurrentView(type);
    setCurrentViewData(type === "all" ? null : data || null);
    if (type === "all") setFilterChannel("");
    setSelectedIds(new Set());
  };

  const submitForm = () => {
    if (!form.name?.trim()) {
      alert("İsim zorunludur!");
      return;
    }
    if (!form.channel) {
      alert("Kanal seçimi gerekli!");
      return;
    }
    const payload: Influencer = {
      id: editingId || uid(),
      name: form.name.trim(),
      link: form.link?.trim() || "",
      channel: form.channel,
      geo: form.geo?.trim() || "",
      lang: form.lang?.trim() || "",
      followers: form.followers ? Number(form.followers) : undefined,
      campaign: form.campaign?.trim() || "",
      avgviews: form.avgviews ? Number(form.avgviews) : undefined,
      erpost: form.erpost ? Number(form.erpost) : undefined,
      vrpost: form.vrpost ? Number(form.vrpost) : undefined,
      erview: form.erview ? Number(form.erview) : undefined,
      price1: form.price1 ? Number(form.price1) : undefined,
      price3: form.price3 ? Number(form.price3) : undefined,
      price5: form.price5 ? Number(form.price5) : undefined,
      extraCampaigns: extraCampaigns.filter((item) => item.name.trim()),
    };

    const newList = editingId
      ? influencers.map((item) => (item.id === editingId ? payload : item))
      : [...influencers, payload];

    setInfluencers(newList);
    setIsAddModalOpen(false);
    setEditingId(null);
    setExtraCampaigns([]);
    setForm({ channel: "" });
    toastShow(editingId ? "Güncellendi" : "Eklendi", editingId ? "✎" : "✓");
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ channel: "" });
    setExtraCampaigns([]);
    setIsAddModalOpen(true);
  };

  const openEdit = (inf: Influencer) => {
    setEditingId(inf.id);
    setForm({ ...inf, followers: inf.followers, avgviews: inf.avgviews, erpost: inf.erpost, vrpost: inf.vrpost, erview: inf.erview, price1: inf.price1, price3: inf.price3, price5: inf.price5 });
    setExtraCampaigns(inf.extraCampaigns || []);
    setIsAddModalOpen(true);
  };

  const deleteOne = (id: string) => {
    if (!confirm("Silinsin mi?")) return;
    setInfluencers((prev) => prev.filter((i) => i.id !== id));
    setLists((prev) => prev.map((l) => ({ ...l, members: l.members.filter((m) => m !== id) })));
    setSelectedIds((prev) => new Set(Array.from(prev).filter((x) => x !== id)));
    toastShow("Silindi", "🗑");
  };

  const deleteSelected = () => {
    if (!selectedIds.size) return;
    if (!confirm(`${selectedIds.size} influencer silinsin mi?`)) return;
    setInfluencers((prev) => prev.filter((i) => !selectedIds.has(i.id)));
    setLists((prev) => prev.map((l) => ({ ...l, members: l.members.filter((id) => !selectedIds.has(id)) })));
    setSelectedIds(new Set());
    toastShow("Silindi", "🗑");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(filtered.map((i) => i.id)));
  };

  const createList = (name: string) => {
    if (!name.trim()) return;
    setLists((prev) => [...prev, { id: uid(), name: name.trim(), members: [] }]);
    setIsListModalOpen(false);
    toastShow("Liste oluşturuldu", "📋");
  };

  const deleteList = (id: string) => {
    if (!confirm("Bu liste silinsin mi?")) return;
    setLists((prev) => prev.filter((l) => l.id !== id));
    if (currentView === "list" && currentViewData === id) setView("all");
    toastShow("Liste silindi", "🗑");
  };

  const addSelectedToList = (listId: string) => {
    if (!selectedIds.size) return;
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        const members = new Set(l.members);
        selectedIds.forEach((id) => members.add(id));
        return { ...l, members: Array.from(members) };
      }),
    );
    setIsAddToListModalOpen(false);
    toastShow(`${selectedIds.size} influencer eklendi`, "📋");
  };

  const buildRows = (data: Influencer[]) => {
    const headers = ["#", "İsim", "Link", "Kanal", "GEO", "Dil", "Takipçi", "Kampanya", "Ort. Görüntülenme", "ER/Post (%)", "VR/Post (%)", "ER/View (%)", "1 Post ($)", "3 Post ($)", "5 Post ($)"];
    const rows = data.map((inf, i) => [
      i + 1,
      inf.name || "",
      inf.link || "",
      inf.channel || "",
      inf.geo || "",
      inf.lang || "",
      Number(inf.followers || ""),
      inf.campaign || "",
      Number(inf.avgviews || ""),
      Number(inf.erpost || ""),
      Number(inf.vrpost || ""),
      Number(inf.erview || ""),
      Number(inf.price1 || ""),
      Number(inf.price3 || ""),
      Number(inf.price5 || ""),
    ]);
    return { headers, rows };
  };

  const getExportData = (): Influencer[] => (exportScope === "all" ? influencers : filtered);

  const downloadCSV = (data: Influencer[], filename: string) => {
    const { headers, rows } = buildRows(data);
    const csv = [headers, ...rows]
      .map((r) =>
        r
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportCSV = () => {
    downloadCSV(getExportData(), "influencers.csv");
    setIsExportModalOpen(false);
    toastShow("CSV indirildi", "📄");
  };

  const exportExcel = () => {
    const { headers, rows } = buildRows(getExportData());
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = [5, 26, 32, 14, 8, 14, 14, 20, 18, 12, 12, 12, 13, 13, 13].map((w) => ({ wch: w }));
    for (let c = 0; c < headers.length; c++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c });
      if (!ws[cell]) ws[cell] = { v: headers[c], t: "s" };
      ws[cell].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { patternType: "solid", fgColor: { rgb: "6C63FF" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }
    XLSX.utils.book_append_sheet(wb, ws, "Influencerlar");
    XLSX.writeFile(wb, "influencers.xlsx");
    setIsExportModalOpen(false);
    toastShow("Excel indirildi", "📊");
  };

  const exportGoogleSheets = () => {
    downloadCSV(getExportData(), "influencers.csv");
    setIsExportModalOpen(false);
    toastShow("CSV indirildi → Google Sheets açılıyor", "🟢");
    setTimeout(() => window.open("https://sheets.new", "_blank"), 500);
  };

  const currentTitle = currentView === "all" ? "Tüm Influencerlar" : currentView === "channel" ? currentViewData ?? "" : lists.find((l) => l.id === currentViewData)?.name ?? "Liste";

  return (
    <div className="app-shell">
      <header className="header">
        <div className="logo">
          <div className="logo-dot" />INFLUX
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setIsListModalOpen(true)}>📋 Liste Oluştur</button>
          <button className="btn btn-primary" onClick={openAdd}>＋ Influencer Ekle</button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Görünüm</div>
            <div className={`sidebar-item ${currentView === "all" ? "active" : ""}`} onClick={() => setView("all")}
                 id="view-all">
              <span className="icon">◈</span><span className="label">Tüm Influencerlar</span><span className="count">{counts.all}</span>
            </div>
          </div>
          <div className="sidebar-divider" />
          <div className="sidebar-section">
            <div className="sidebar-label">Listelerim</div>
            <div id="lists-sidebar">
              {lists.map((l) => (
                <div className="sidebar-item" key={l.id} onClick={() => setView("list", l.id)}>
                  <span className="icon">◧</span><span className="label">{l.name}</span>
                  <span className="count">{l.members.length}</span>
                  <button className="btn btn-danger btn-sm" onClick={(ev) => { ev.stopPropagation(); deleteList(l.id); }} title="Sil">×</button>
                </div>
              ))}
            </div>
            <div className="sidebar-add-list" onClick={() => setIsListModalOpen(true)}>＋ Yeni liste ekle</div>
          </div>
          <div className="sidebar-divider" />
          <div className="sidebar-section">
            <div className="sidebar-label">Kanala Göre</div>
            {CHANNELS.map((t) => (
              <div className={`sidebar-item ${currentView === "channel" && currentViewData === t ? "active" : ""}`} key={t} onClick={() => { setFilterChannel(t); setView("channel", t); }}>
                <span className="icon">{chIcon(t)}</span><span className="label">{t}</span>
                <span className="count">{counts[t]}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="main">
          <div className="view-header">
            <div className="view-label">{currentTitle} <span id="view-subtitle">– {filtered.length}</span></div>
            <button className="btn btn-export btn-sm" onClick={() => { setIsExportModalOpen(true); setExportScope("current"); }}>↑ Dışa Aktar</button>
          </div>

          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input
                className="search-input"
                value={search}
                placeholder="İsim, kanal, ülke ara..."
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              style={{ width: "auto", padding: "7px 10px", fontSize: "11px" }}
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
            >
              <option value="">Tüm Kanallar</option>
              {CHANNELS.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
            <div className={`selection-info ${selectedIds.size > 0 ? "visible" : ""}`}>
              {selectedIds.size} seçili
            </div>
            <div className="toolbar-right">
              <button className="btn btn-ghost btn-sm" style={{ display: selectedIds.size > 0 ? "" : "none" }} onClick={() => setIsAddToListModalOpen(true)}>📋 Listeye Ekle</button>
              <button className="btn btn-danger btn-sm" style={{ display: selectedIds.size > 0 ? "" : "none" }} onClick={deleteSelected}>🗑 Sil</button>
            </div>
          </div>

          <div className="stats-bar">
            <div className="stat-chip"><div className="stat-dot" style={{ background: "var(--accent)" }} /> <strong>{stats.total}</strong> influencer</div>
            <div className="stat-chip"><div className="stat-dot" style={{ background: "var(--green)" }} />Takipçi: <strong>{fmtNum(stats.tf)}</strong></div>
            {stats.aveER && <div className="stat-chip"><div className="stat-dot" style={{ background: "var(--amber)" }} />Ort. ER: <strong>{stats.aveER}%</strong></div>}
            {stats.totalPrice1 > 0 && <div className="stat-chip"><div className="stat-dot" style={{ background: "var(--accent3)" }} />1-Post toplam: <strong>${stats.totalPrice1.toLocaleString()}</strong></div>}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="checkbox-col"><input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} /></th>
                  <th>#</th><th>İSİM</th><th>BAĞLANTI</th><th>KANAL</th><th>GEO</th><th>DİL</th>
                  <th>TAKİPÇİ</th><th>KAMPANYA</th><th>ORT. GÖRÜNTÜLENME</th>
                  <th>ER/POST</th><th>VR/POST</th><th>ER/VIEW</th><th>1 POST</th><th>3 POST</th><th>5 POST</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={17} style={{ padding: "24px", textAlign: "center" }}><div className="empty-state"><div className="empty-icon">◫</div><p>Henüz influencer yok</p><button className="btn btn-primary" onClick={openAdd}>＋ İlk influencer&#39;ı ekle</button></div></td></tr>
                ) : filtered.map((inf, idx) => (
                  <tr key={inf.id} className={selectedIds.has(inf.id) ? "selected" : ""} onClick={() => openEdit(inf)}>
                    <td className="checkbox-col" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(inf.id)} onChange={() => toggleSelect(inf.id)} /></td>
                    <td className="row-num">{idx + 1}</td>
                    <td className="name-cell">{inf.name || "—"}</td>
                    <td className="link-cell">{inf.link ? <a href={inf.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>↗ link</a> : "—"}</td>
                    <td><span className={`channel-badge ${chClass(inf.channel)}`}>{inf.channel || "—"}</span></td>
                    <td>{inf.geo || "—"}</td>
                    <td>{inf.lang || "—"}</td>
                    <td className="num-cell">{fmtNum(inf.followers)}</td>
                    <td>{inf.campaign || "—"}</td>
                    <td className="num-cell">{fmtNum(inf.avgviews)}</td>
                    <td className={`er-val ${erClass(inf.erpost)}`}>{inf.erpost ? `${inf.erpost}%` : "—"}</td>
                    <td className={`er-val ${erClass(inf.vrpost)}`}>{inf.vrpost ? `${inf.vrpost}%` : "—"}</td>
                    <td className={`er-val ${erClass(inf.erview)}`}>{inf.erview ? `${inf.erview}%` : "—"}</td>
                    <td className="num-cell">{fmtPrice(inf.price1)}</td>
                    <td className="num-cell">{fmtPrice(inf.price3)}</td>
                    <td className="num-cell">{fmtPrice(inf.price5)}</td>
                    <td className="action-cell" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEdit(inf)} title="Düzenle">✎</button>
                      <button onClick={() => deleteOne(inf.id)} title="Sil">🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {isAddModalOpen && (
        <div className="modal-overlay open" onClick={(e) => e.currentTarget === e.target && setIsAddModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editingId ? "Influencer Düzenle" : "Influencer Ekle"}</div>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group form-full"><label className="form-label">İsim *</label><input className="form-input" value={form.name || ""} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="@username veya gerçek isim" /></div>
                <div className="form-group form-full"><label className="form-label">Bağlantı</label><input className="form-input" value={form.link || ""} onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))} placeholder="https://..." /></div>
                <div className="form-group"><label className="form-label">Kanal *</label><select className="form-select" value={form.channel || ""} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))}>
                    <option value="">Seç...</option>
                    {CHANNELS.map((ch) => (<option key={ch}>{ch}</option>))}
                  </select></div>
                <div className="form-group"><label className="form-label">GEO (Ülke)</label><input className="form-input" value={form.geo || ""} onChange={(e) => setForm((p) => ({ ...p, geo: e.target.value }))} placeholder="TR, US, DE..." /></div>
                <div className="form-group"><label className="form-label">Dil</label><input className="form-input" value={form.lang || ""} onChange={(e) => setForm((p) => ({ ...p, lang: e.target.value }))} placeholder="Turkish, English..." /></div>
                <div className="form-group"><label className="form-label">Takipçi / Üye Sayısı</label><input className="form-input" type="number" value={form.followers ?? ""} onChange={(e) => setForm((p) => ({ ...p, followers: Number(e.target.value) }))} placeholder="500000" /></div>
                <div className="form-group"><label className="form-label">Kampanya</label><input className="form-input" value={form.campaign || ""} onChange={(e) => setForm((p) => ({ ...p, campaign: e.target.value }))} placeholder="Kampanya adı" /></div>
                <div className="form-group"><label className="form-label">Ort. Görüntülenme</label><input className="form-input" type="number" value={form.avgviews ?? ""} onChange={(e) => setForm((p) => ({ ...p, avgviews: Number(e.target.value) }))} placeholder="25000" /></div>
                <div className="form-group"><label className="form-label">ER/Post (%)</label><input className="form-input" type="number" step="0.01" value={form.erpost ?? ""} onChange={(e) => setForm((p) => ({ ...p, erpost: Number(e.target.value) }))} placeholder="3.5" /></div>
                <div className="form-group"><label className="form-label">VR/Post (%)</label><input className="form-input" type="number" step="0.01" value={form.vrpost ?? ""} onChange={(e) => setForm((p) => ({ ...p, vrpost: Number(e.target.value) }))} placeholder="12.5" /></div>
                <div className="form-group"><label className="form-label">ER/View (%)</label><input className="form-input" type="number" step="0.01" value={form.erview ?? ""} onChange={(e) => setForm((p) => ({ ...p, erview: Number(e.target.value) }))} placeholder="8.2" /></div>
              </div>
              <div className="form-section">
                <div className="form-section-title">💰 Fiyatlandırma</div>
                <div className="price-grid">
                  <div className="price-card"><div className="price-card-label">1 Post</div><div className="price-input-wrap"><span className="price-currency">$</span><input className="price-input" type="number" value={form.price1 ?? ""} onChange={(e) => setForm((p) => ({ ...p, price1: Number(e.target.value) }))} placeholder="0" /></div></div>
                  <div className="price-card"><div className="price-card-label">3 Post</div><div className="price-input-wrap"><span className="price-currency">$</span><input className="price-input" type="number" value={form.price3 ?? ""} onChange={(e) => setForm((p) => ({ ...p, price3: Number(e.target.value) }))} placeholder="0" /></div></div>
                  <div className="price-card"><div className="price-card-label">5 Post</div><div className="price-input-wrap"><span className="price-currency">$</span><input className="price-input" type="number" value={form.price5 ?? ""} onChange={(e) => setForm((p) => ({ ...p, price5: Number(e.target.value) }))} placeholder="0" /></div></div>
                </div>
              </div>
              <div className="form-section">
                <div className="form-section-title">🎯 Ekstra Kampanyalar <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 400, fontFamily: "var(--font-mono)" }}>opsiyonel</span></div>
                <div className="campaigns-list">
                  {extraCampaigns.map((c, i) => (
                    <div className="campaign-row" key={`${c.name}-${i}`}>
                      <input className="form-input" style={{ fontSize: 12 }} placeholder="Kampanya adı" value={c.name} onChange={(e) => setExtraCampaigns((prev) => prev.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
                      <div style={{ position: "relative" }}><span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", fontSize: 12 }}>$</span><input className="form-input" style={{ paddingLeft: 22, fontSize: 12 }} type="number" value={c.price ?? ""} onChange={(e) => setExtraCampaigns((prev) => prev.map((x, k) => (k === i ? { ...x, price: Number(e.target.value) } : x)))} placeholder="Fiyat" /></div>
                      <button className="remove-campaign" onClick={() => setExtraCampaigns((prev) => prev.filter((_, k) => k !== i))}>×</button>
                    </div>
                  ))}
                </div>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setExtraCampaigns((prev) => [...prev, { name: "", price: undefined }])}>＋ Kampanya Ekle</button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setIsAddModalOpen(false)}>İptal</button>
              <button className="btn btn-primary" onClick={submitForm}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="modal-overlay open" onClick={(e) => e.currentTarget === e.target && setIsExportModalOpen(false)}>
          <div className="export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="export-header">
              <div style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 700 }}>↑ Dışa Aktar</div>
              <button className="modal-close" onClick={() => setIsExportModalOpen(false)}>✕</button>
            </div>
            <div className="export-scope-row">
              <div className="scope-label">Kapsam:</div>
              <div className="scope-pills">
                <button className={`scope-pill ${exportScope === "current" ? "active" : ""}`} onClick={() => setExportScope("current")}>{currentTitle} ({filtered.length})</button>
                <button className={`scope-pill ${exportScope === "all" ? "active" : ""}`} onClick={() => setExportScope("all")}>Tümü ({influencers.length})</button>
              </div>
            </div>
            <div className="export-options">
              <button className="export-option gs" onClick={exportGoogleSheets}>
                <div className="export-icon">📊</div>
                <div className="export-text"><div className="export-name">Google Sheets</div><div className="export-desc">CSV olarak indir, ardından sheets.new açılır — tek tıkla içe aktar</div></div>
                <div className="export-arrow">→</div>
              </button>
              <button className="export-option xl" onClick={exportExcel}>
                <div className="export-icon">🧾</div>
                <div className="export-text"><div className="export-name">Excel (.xlsx)</div><div className="export-desc">Biçimlendirilmiş Microsoft Excel dosyası, başlıklar renkli</div></div>
                <div className="export-arrow">→</div>
              </button>
              <button className="export-option cv" onClick={exportCSV}>
                <div className="export-icon">📄</div>
                <div className="export-text"><div className="export-name">CSV Dosyası</div><div className="export-desc">Evrensel format — her tablolama aracında ve veritabanında açılır</div></div>
                <div className="export-arrow">→</div>
              </button>
            </div>
            <div className="export-tip">
              <strong>💡 Google Sheets için:</strong> CSV indirilir ve <strong>sheets.new</strong> açılır. Oradan <em>Dosya → İçe Aktar → Yükle</em> adımını izleyin.
            </div>
          </div>
        </div>
      )}

      {isListModalOpen && (
        <div className="modal-overlay open" onClick={(e) => e.currentTarget === e.target && setIsListModalOpen(false)}>
          <div className="mini-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Yeni Liste Oluştur</div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Liste Adı</label>
              <input className="form-input" autoFocus id="listNameInput" placeholder="örn: Q1 Kampanyası, Moda Listesi..." />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setIsListModalOpen(false)}>İptal</button>
              <button className="btn btn-primary" onClick={() => {
                const input = document.getElementById("listNameInput") as HTMLInputElement | null;
                if (input) createList(input.value);
              }}>Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {isAddToListModalOpen && (
        <div className="modal-overlay open" onClick={(e) => e.currentTarget === e.target && setIsAddToListModalOpen(false)}>
          <div className="mini-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Listeye Ekle</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {lists.length === 0 ? (
                <div style={{ color: "var(--text3)", fontSize: 12 }}>Önce liste oluşturun.</div>
              ) : lists.map((l) => (
                <button key={l.id} className="btn btn-ghost" style={{ justifyContent: "flex-start", gap: 8 }} onClick={() => addSelectedToList(l.id)}>
                  <span>◧</span>{l.name}<span style={{ marginLeft: "auto", color: "var(--text3)" }}>{l.members.length} üye</span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setIsAddToListModalOpen(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast ${toast.active ? "show" : ""}`} id="toast"><span id="toastIcon">{toast.icon}</span><span id="toastMsg">{toast.text}</span></div>
    </div>
  );
}
