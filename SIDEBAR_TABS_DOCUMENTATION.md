# Sidebar Tabs Documentation

Ye document BMS project ke sidebar tabs ka purpose explain karta hai. Isko reference, handover, planning, ya future development me use kiya ja sakta hai.

## Overview

Sidebar ka main kaam app ke different modules/pages ko navigate karna hai.

- `activeTab` track karta hai ki user abhi kis tab/page par hai.
- Tab click hone par `activeTab` update hota hai.
- Current tab URL hash me save hota hai, jaise `#tab=dashboard&project=...`.
- Page refresh ya browser back/forward ke time same tab restore ho sakta hai.
- Project-specific tabs ke liye pehle project select karna zaroori hai.

## Sidebar Sections

Sidebar mainly 4 parts me divided hai:

1. Global tabs
2. Project selector
3. Project tabs
4. Footer actions

## Global Tabs

Global tabs bina project select kiye open ho sakte hain.

| Tab | Tab ID | Purpose |
| --- | --- | --- |
| Team Zyrex | `about` | Default/home type page. Team ya company information dikhata hai. |
| BOQ Prepare | `boq_prepare` | BOQ preparation ke liye tab hai. Sidebar aur permission mapping me available hai, lekin current `App.jsx` me page render mapping missing lagti hai. |
| Create > Intake | `create__intake` | Intake list/dashboard open karta hai. |
| Create > Order | `create__order` | Global order create/edit page open karta hai. |
| Procurement Setup > Company List | `proc_setup__company_list` | Company master/setup list manage karta hai. |
| Procurement Setup > Site List | `proc_setup__site_list` | Site list manage karta hai. |
| Procurement Setup > Vendor List | `proc_setup__vendor_list` | Vendor list manage karta hai. |
| Procurement Setup > UOM | `proc_setup__uom` | Unit of Measurement manage karta hai, jaise Nos, Kg, Meter. |
| Procurement Setup > Category List | `proc_setup__category_list` | Item/category setup manage karta hai. |
| Procurement Setup > Item List | `proc_setup__item_list` | Procurement item master/list manage karta hai. |
| Procurement Setup > Term Condition | `proc_setup__term_condition` | Order/document terms and conditions master manage karta hai. |
| Procurement Setup > Payment Terms | `proc_setup__payment_terms` | Payment terms master manage karta hai. |
| Procurement Setup > Government Laws | `proc_setup__government_laws` | Government laws/clauses master manage karta hai. |
| Procurement Setup > Contact List | `proc_setup__contact_list` | Contact master/list manage karta hai. |
| Procurement Setup > Annexure | `proc_setup__annexure` | Annexure master setup manage karta hai. |
| Master Data > Vendor Master Data | `master_data__vendor_master_data` | Vendor master data page open karta hai. |
| Master Data > Item Master Data | `master_data__item_master_data` | Item master data page open karta hai. |
| Audit | `audit` | Audit module ke liye tab hai. Current page placeholder hai: `Audit - Coming soon`. |

## Project Selector

Project selector sidebar me Global aur Project tabs ke beech me hota hai.

| Item | Purpose |
| --- | --- |
| Select project... | User ko active project choose karne deta hai. |
| All Project | Sab projects ka combined option. Iska behavior page/component support par depend karta hai. |
| Active project list | Backend se active projects fetch hote hain aur dropdown me show hote hain. |

## Project Tabs

Project tabs selected project ke context me kaam karte hain. Agar project select nahi hai, app `Please select a project first` message dikhata hai.

| Tab | Tab ID | Purpose |
| --- | --- | --- |
| Dashboard | `dashboard` | Selected project ka overview/dashboard dikhata hai. |
| 3D View | `view_3d` | Selected project ka 3D model/view open karta hai. |
| Confidential > LOA | `confidential__loa` | Letter of Award related confidential page/docs. |
| Confidential > BOQ | `confidential__boq` | Project BOQ confidential section. |
| Confidential > Drawings | `confidential__drawings` | Project drawings/docs section. |
| Confidential > RA Bills | `confidential__ra_bills` | RA bills related confidential page/docs. |
| Finance > Payment Request | `finance__payment_request` | Payment request ke liye tab hai, lekin current `App.jsx` me page render mapping missing lagti hai. |
| Finance > Site Expense | `finance__site_expense` | Site expense records/page. |
| Finance > Petty Cash | `finance__petty_cash` | Petty cash records/page. |
| Finance > Bills Docs | `finance__bills_docs` | Bills documents page. |
| Work Activity > Execution Plan | `work__execution_plan` | Project execution plan page. |
| Work Activity > MSP Plan | `work__msp_plan` | MSP plan page. |
| Staff Attendance | `staff` | Attendance module open karta hai. |
| Manpower > Daily Manpower | `manpower__daily_manpower` | Daily manpower entry/records. |
| Manpower > All Record | `manpower__all_record` | Manpower ke all records. |
| Store > Received Record | `store__received_record` | Store received material records. |
| Store > Local Purchase | `store__local_purchase` | Local purchase records. |
| Store > Consumption Record | `store__consumption_record` | Material consumption records. |
| Store > Stock Available | `store__stock_available` | Available stock view. |
| Store > GRN Docs | `store__grn_docs` | GRN documents page. |
| Procurement > Order Dashboard | `procurement__order_dashboard` | Project-wise procurement order dashboard. |
| Procurement > Intake Dashboard | `procurement__intake_dashboard` | Project-wise intake dashboard/list. |
| Images > All Images | `images__all_images` | Project images gallery/list. |
| Images > Compare Images | `images__compare_images` | Images comparison page. |

## Footer Actions

| Action | Tab ID / Behavior | Purpose |
| --- | --- | --- |
| Profile | `profile` | User profile page open karta hai. |
| Logout | Clears login state | Token aur user data clear karke login screen par bhejta hai. |

## Permission Handling

Sidebar tabs permissions ke basis par show/hide hote hain.

- `global_admin` ko saare tabs visible hote hain.
- `about` aur `profile` always visible hain.
- Non-admin users ke liye `userTabPermissions` ke basis par tabs filter hote hain.
- Har tab ka `tabId` database ke `module_key` se map hota hai.
- Agar permission load nahi hui hai, gated tabs hidden rehte hain.
- Agar permission map me module missing hai, current logic us tab ko visible allow karta hai.

## Known Issues / Notes

### 1. Tab ID mismatch

Sidebar sub-tab IDs double underscore format me generate karta hai:

```text
confidential__loa
finance__site_expense
work__execution_plan
store__received_record
images__all_images
```

Lekin current `App.jsx` me kai project tab cases single underscore format me check ho rahe hain:

```text
confidential_loa
finance_site_expense
work_execution_plan
store_received_record
images_all_images
```

Is mismatch ki wajah se kuch tabs click karne par actual page open nahi hoga aur app `Page not created yet: <activeTab>` dikha sakta hai.

Affected groups likely:

- Confidential
- Finance
- Work Activity
- Manpower
- Store
- Images

Procurement project tabs double underscore format me match kar rahe hain, isliye wo comparatively correct lagte hain.

### 2. Missing page mappings

Sidebar me kuch tabs available hain, lekin `App.jsx` me unki direct render mapping missing lagti hai:

| Tab | Tab ID |
| --- | --- |
| BOQ Prepare | `boq_prepare` |
| Finance > Payment Request | `finance__payment_request` |

In tabs ke liye page component ya route mapping add karni hogi.

## Main Files

| File | Role |
| --- | --- |
| `frontend/src/components/Sidebar.jsx` | Sidebar menu structure, tab click handling, permission filtering, project selector. |
| `frontend/src/App.jsx` | `activeTab` state, URL hash sync, selected project state, aur active tab ke basis par page rendering. |

## Short Summary

Sidebar navigation ka center point `activeTab` hai. `Sidebar.jsx` active tab set karta hai, aur `App.jsx` us active tab ke basis par decide karta hai ki kaunsa page/component render hoga. Global tabs direct open hote hain, project tabs ke liye selected project required hai.
