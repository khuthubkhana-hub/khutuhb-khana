import{r as d,j as e,X as j,L as g,d as w}from"./index-R4TGlwoz.js";const N=({onClose:c,allMembers:r})=>{const[l,o]=d.useState(new Set),[h,x]=d.useState(!1),[p,m]=d.useState(""),a=d.useMemo(()=>{const t=new Set(r.map(i=>i.class).filter(Boolean));return Array.from(t).sort()},[r]),u=t=>{o(i=>{const n=new Set(i);return n.has(t)?n.delete(t):n.add(t),n})},b=()=>{l.size===a.length?o(new Set):o(new Set(a))},f=()=>{x(!0);const t=l.size>0?r.filter(s=>s.class&&l.has(s.class)):r;if(t.length===0){alert("No members to print for the selected classes."),x(!1);return}const n=`
      <div id="member-print-area">
        <h1>Muhimmath Library - Member List</h1>
        <table>
          <thead>
            <tr>
              <th>Reg. No</th>
              <th>Name</th>
              <th>Class</th>
              <th>Phone</th>
              <th>Place</th>
            </tr>
          </thead>
          <tbody>
            ${t.map(s=>`
        <tr>
          <td>${s.register_number||"N/A"}</td>
          <td>${s.name}</td>
          <td>${s.class||"N/A"}</td>
          <td>${s.phone||"N/A"}</td>
          <td>${s.place||"N/A"}</td>
        </tr>
      `).join("")}
          </tbody>
        </table>
      </div>
    `;m(n),setTimeout(()=>{window.print(),x(!1),m(""),c()},500)};return e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:hidden",children:e.jsxs("div",{className:"bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col",children:[e.jsxs("div",{className:"flex justify-between items-center p-6 border-b",children:[e.jsx("h2",{className:"text-xl font-semibold",children:"Print Member List"}),e.jsx("button",{onClick:c,children:e.jsx(j,{})})]}),e.jsxs("div",{className:"p-6 flex-grow overflow-y-auto",children:[e.jsx("p",{className:"text-sm text-neutral-600 mb-4",children:"Select classes to print. If no classes are selected, all members will be printed."}),e.jsxs("div",{className:"flex justify-between items-center mb-2",children:[e.jsx("h3",{className:"font-semibold",children:"Filter by Class"}),e.jsx("button",{onClick:b,className:"text-sm font-medium text-primary",children:l.size===a.length?"Deselect All":"Select All"})]}),e.jsx("div",{className:"border rounded-lg max-h-60 overflow-y-auto p-3 space-y-2 bg-neutral-50",children:a.map(t=>e.jsxs("label",{className:"flex items-center gap-3 p-2 rounded-md hover:bg-neutral-100 cursor-pointer",children:[e.jsx("input",{type:"checkbox",checked:l.has(t),onChange:()=>u(t),className:"h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary-light"}),e.jsx("span",{children:t})]},t))})]}),e.jsxs("div",{className:"p-6 border-t flex justify-end gap-3",children:[e.jsx("button",{onClick:c,className:"px-4 py-2 bg-neutral-100 rounded-md",children:"Cancel"}),e.jsxs("button",{onClick:f,disabled:h,className:"px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2 disabled:opacity-50",children:[h?e.jsx(g,{className:"animate-spin"}):e.jsx(w,{size:18}),"Print List"]})]})]})}),h&&e.jsx("div",{dangerouslySetInnerHTML:{__html:p}})]})};export{N as default};
