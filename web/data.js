// Subrogation Opportunity Scout — mock data
// CLM-2026-00481: HIGH confidence, full doc content (primary demo claim)
// CLM-2026-00355: LOW confidence, full doc content (failure case)
// others: partial data sufficient for queue display

window.TIER_CONFIG = {
  HIGH:   { color: '#10B981', dark: '#047857', bg: '#D1FAE5', label: 'HIGH' },
  MEDIUM: { color: '#F59E0B', dark: '#B45309', bg: '#FEF3C7', label: 'MEDIUM' },
  LOW:    { color: '#EF4444', dark: '#B91C1C', bg: '#FEE2E2', label: 'LOW' },
};

window.ACTION_CONFIG = {
  ROUTE_TO_DEMAND:  { label: 'ROUTE TO DEMAND LETTER', color: '#047857', bg: '#D1FAE5', border: '#6EE7B7' },
  GATHER_MORE_INFO: { label: 'GATHER MORE INFO',        color: '#B45309', bg: '#FEF3C7', border: '#FCD34D' },
  REJECT:           { label: 'REJECT',                  color: '#B91C1C', bg: '#FEE2E2', border: '#FCA5A5' },
  DEFER:            { label: 'DEFER',                   color: '#6B7280', bg: '#F3F4F6', border: '#D1D5DB' },
};

window.CLAIMS = [
  // ── CLM-2026-00481 ── HIGH confidence, full docs, primary demo ──────────
  {
    id: 'CLM-2026-00481',
    confidence: 0.92, tier: 'HIGH',
    lob: 'Personal auto', fnolRelative: '6 days ago',
    recovery: 8500, recoveryBasis: 'Repair + rental (confirmed invoices)',
    solDate: '2028-05-21', solUrgent: false, solDays: 728, solState: 'OR',
    thesis: 'Named third party rear-ended insured at a controlled intersection. Police report and independent witness confirm sole fault; citations issued to third party.',
    action: 'ROUTE_TO_DEMAND', status: 'pending',
    thirdParty: { name: 'Tyler Rasmussen', type: 'Named driver', carrier: 'Pacific Coast Indemnity Group', identified: true },
    evidence: [
      { id: 1, docKey: 'FNOL', source: 'FNOL',
        quote: 'The third party, Tyler Rasmussen, was cited by Officer R. Delgado for following too closely (ORS 811.485) and failure to stop at a red light (ORS 811.260). He acknowledged fault at the scene to the responding officer.',
        claim: 'Third party received citations confirming fault and made verbal acknowledgment of liability at scene.' },
      { id: 2, docKey: 'Police Report', source: 'Police Report',
        quote: 'Party 2 (Rasmussen) was traveling northbound on NW 23rd Ave when he failed to observe the traffic signal change to red. Party 1 vehicle was stationary at the stop line. Point of impact consistent with rear-end collision at approximately 30–35 MPH. Skid marks absent, indicating no braking prior to impact.',
        claim: 'Officer narrative independently corroborates that insured was stationary and third party failed to brake.' },
      { id: 3, docKey: 'Police Report', source: 'Police Report',
        quote: 'Independent witness, Ms. J. Hwang, confirmed that the traffic signal had been red for approximately 8–10 seconds prior to impact. Witness provided written statement at scene.',
        claim: 'Third-party eyewitness confirms signal state and timing, reinforcing exclusive third-party fault.' },
    ],
    contradicting: [],
    warnings: [],
    openQuestions: [],
    docs: {
      'FNOL': { parts: [
        { t: 'text', v: 'FIRST NOTICE OF LOSS — #FL-2026-00481\nFiled: 05/23/2026 09:14 UTC\nPolicy: PA-449021  |  Claimant: Marcus Webb\nVehicle: 2022 Honda Accord (OR 847-XWQ)\n\nIncident narrative:\nOn 05/22/2026 at approximately 3:40 PM, the insured vehicle was stopped at a red light at the intersection of NW 23rd Avenue and Burnside Street, Portland, OR. A 2019 Ford F-150, operated by Tyler Rasmussen (DOB 04/12/1985, DL# OR-2847561), failed to stop and struck the insured vehicle from behind at an estimated 35 MPH.\n\n' },
        { t: 'ev', id: 1, v: 'The third party, Tyler Rasmussen, was cited by Officer R. Delgado for following too closely (ORS 811.485) and failure to stop at a red light (ORS 811.260). He acknowledged fault at the scene to the responding officer.' },
        { t: 'text', v: '\n\nDamage assessment: Rear bumper, trunk, and rear suspension. Vehicle towed from scene. Airbags did not deploy. Insured declined medical treatment at scene.\n\nThird-party insurer: Pacific Coast Indemnity Group, claim reference PC-2026-77341.\nContact: (503) 442-7700.\n\nFiled by: J. Flores, Intake, 05/23/2026 09:14 UTC' },
      ]},
      'Police Report': { parts: [
        { t: 'text', v: 'PORTLAND POLICE BUREAU — Traffic Incident Report\nReport #: PPB-2026-142893\nDate: 05/22/2026  |  Time: 15:47\nLocation: NW 23rd Ave & Burnside St, Portland OR\n\nResponding officer: R. Delgado, Badge #4471\n\nParties:\nParty 1 (not at fault): Marcus Webb, 2022 Honda Accord, OR 847-XWQ\nParty 2 (at fault): Tyler Rasmussen, 2019 Ford F-150, OR 112-TKR\n\nOfficer narrative:\n' },
        { t: 'ev', id: 2, v: 'Party 2 (Rasmussen) was traveling northbound on NW 23rd Ave when he failed to observe the traffic signal change to red. Party 1 vehicle was stationary at the stop line. Point of impact consistent with rear-end collision at approximately 30–35 MPH. Skid marks absent, indicating no braking prior to impact.' },
        { t: 'text', v: '\n\nCitations issued:\n— ORS 811.485  (Following too closely)\n— ORS 811.260  (Failure to obey traffic control device)\n\nNo alcohol or controlled substances suspected. Both parties exchanged insurance information. Party 1 vehicle towed. Party 2 vehicle drivable.\n\n' },
        { t: 'ev', id: 3, v: 'Independent witness, Ms. J. Hwang, confirmed that the traffic signal had been red for approximately 8–10 seconds prior to impact. Witness provided written statement at scene.' },
        { t: 'text', v: '\n\nReport finalized: 05/22/2026 18:30 UTC' },
      ]},
      'Witness: Hwang': { parts: [
        { t: 'text', v: 'WITNESS STATEMENT\nClaim: CLM-2026-00481  |  Witness: Julia Hwang\nDate: 05/22/2026\nRecorded by: Officer R. Delgado\n\nI was standing at the corner of NW 23rd and Burnside waiting for the pedestrian signal when I saw the accident happen. The light had been red — I\'d say at least 8 seconds, maybe 10 — when the truck hit the car from behind. The car wasn\'t moving at all. The truck didn\'t slow down before impact.\n\nI didn\'t see any brake lights on the truck before impact. The car had its brake lights on the whole time.\n\nI gave my contact information to the officer and agreed to provide this written statement.\n\nContact: (503) 614-0892\nSigned: Julia Hwang  |  05/22/2026' },
      ]},
      'Repair Estimate': { parts: [
        { t: 'text', v: 'REPAIR ESTIMATE — Cascade Collision Repair, Portland OR\nEstimate #: CCR-2026-8841  |  Date: 05/24/2026\n\nVehicle: 2022 Honda Accord, OR 847-XWQ\nInsured: Marcus Webb  |  Policy PA-449021\n\nLine items:\n  Rear bumper cover (replace)          $1,240.00\n  Rear fascia reinforcement               $640.00\n  Trunk lid (replace)                   $1,800.00\n  Rear suspension, lower control arm    $2,100.00\n  Labor (28.5 hrs @ $95/hr)            $2,707.50\n  Paint                                   $380.00\n  Rental vehicle (14 days, est.)          $490.00\n                                       ─────────\n  Subtotal                             $9,357.50\n  OEM parts discount                    −$857.50\n                                       ─────────\n  Total authorized estimate            $8,500.00\n\nPrepared by: Kevin Marsh, CAS Level II\nAuthorized for repair: 05/25/2026' },
      ]},
    },
    auditTrail: [
      { ts: '2026-05-23 09:15 UTC', type: 'claim_received', detail: 'FNOL submitted via portal' },
      { ts: '2026-05-23 09:16 UTC', type: 'model_run',      modelVersion: 'claude-opus-4', confidence: 0.92, detail: 'Flagged: ROUTE TO DEMAND LETTER' },
    ],
  },

  // ── CLM-2026-00389 ── HIGH, SOL URGENT ──────────────────────────────────
  {
    id: 'CLM-2026-00389',
    confidence: 0.87, tier: 'HIGH',
    lob: 'Personal auto', fnolRelative: '19 days ago',
    recovery: 12200, recoveryBasis: 'Repair + medical (partial)',
    solDate: '2026-06-20', solUrgent: true, solDays: 22, solState: 'OR',
    thesis: 'Third party conceded fault at scene; FNOL and repair invoices confirm clean liability. SOL expires in 22 days — action required.',
    action: 'ROUTE_TO_DEMAND', status: 'pending',
    thirdParty: { name: 'Erin Castellano', type: 'Named driver', carrier: 'Hartfield Insurance Group', identified: true },
    evidence: [], contradicting: [], warnings: [], openQuestions: [],
    docs: { 'FNOL': { parts: [{ t: 'text', v: 'FNOL on file. See paper record #FL-2026-00389.\nPersonal auto rear-end — third party cited and accepted fault at scene.' }] } },
    auditTrail: [
      { ts: '2026-05-10 14:30 UTC', type: 'claim_received', detail: 'FNOL submitted via portal' },
      { ts: '2026-05-10 14:31 UTC', type: 'model_run',      modelVersion: 'claude-opus-4', confidence: 0.87, detail: 'Flagged: ROUTE TO DEMAND LETTER' },
    ],
  },

  // ── CLM-2026-00467 ── HIGH, SOL URGENT ──────────────────────────────────
  {
    id: 'CLM-2026-00467',
    confidence: 0.91, tier: 'HIGH',
    lob: 'Personal auto', fnolRelative: '4 days ago',
    recovery: 9750, recoveryBasis: 'Repair + medical',
    solDate: '2026-07-04', solUrgent: true, solDays: 36, solState: 'WA',
    thesis: 'Third party ran red light at marked intersection; two independent witnesses and dashcam footage cited in police report confirm fault.',
    action: 'ROUTE_TO_DEMAND', status: 'pending',
    thirdParty: { name: 'Wayne Thornton', type: 'Named driver', carrier: 'Cardinal State Insurance', identified: true },
    evidence: [], contradicting: [], warnings: [], openQuestions: [],
    docs: { 'FNOL': { parts: [{ t: 'text', v: 'FNOL on file. Intersection collision, 05/25/2026.' }] } },
    auditTrail: [
      { ts: '2026-05-25 09:00 UTC', type: 'claim_received', detail: 'FNOL submitted' },
      { ts: '2026-05-25 09:01 UTC', type: 'model_run',      modelVersion: 'claude-opus-4', confidence: 0.91, detail: 'Flagged: ROUTE TO DEMAND LETTER' },
    ],
  },

  // ── CLM-2026-00412 ── MEDIUM ─────────────────────────────────────────────
  {
    id: 'CLM-2026-00412',
    confidence: 0.62, tier: 'MEDIUM',
    lob: 'General liability', fnolRelative: '14 days ago',
    recovery: 3400, recoveryBasis: 'Medical + lost wages',
    solDate: '2027-03-15', solUrgent: false, solDays: 290, solState: 'WA',
    thesis: 'Slip-and-fall on contractor-maintained property; primary liability may rest with unidentified subcontractor. Contractor identity requires verification before routing.',
    action: 'GATHER_MORE_INFO', status: 'pending',
    thirdParty: { name: '[Unconfirmed]', type: 'Contractor (unverified)', carrier: '[Unknown]', identified: false },
    evidence: [
      { id: 1, docKey: 'FNOL', source: 'FNOL',
        quote: 'The property manager stated: "We don\'t handle the outdoor walkways — that\'s on our contractor."',
        claim: 'Property owner statement shifts maintenance liability to an unidentified contractor, supporting subrogation theory.' },
    ],
    contradicting: [
      { id: 'C1', docKey: 'FNOL', source: 'FNOL',
        quote: 'Building management could not provide the contractor\'s name or any written maintenance agreement at time of intake.',
        claim: 'Without a named party and verified insurer, a subrogation demand cannot be issued.' },
    ],
    warnings: [
      'Contractor identity unconfirmed — demand letter cannot be issued without a named, insured third party.',
      'Verbal-only maintenance arrangement may be inadmissible as the sole basis for liability transfer.',
    ],
    openQuestions: [
      'Who is the named subcontractor, and what is their liability insurer?',
      'Can property owner produce written or email records of the maintenance arrangement?',
    ],
    docs: {
      'FNOL': { parts: [
        { t: 'text', v: 'FIRST NOTICE OF LOSS — #FL-2026-00412\nFiled: 05/15/2026\n\nGeneral liability — slip and fall on commercial property, 05/14/2026.\n\nProperty owner statement:\n' },
        { t: 'ev', id: 1, v: 'The property manager stated: "We don\'t handle the outdoor walkways — that\'s on our contractor."' },
        { t: 'text', v: '\n\n' },
        { t: 'cv', id: 'C1', v: 'Building management could not provide the contractor\'s name or any written maintenance agreement at time of intake.' },
        { t: 'text', v: '\n\nFiled by: J. Torres, 05/15/2026 11:00 UTC' },
      ]},
    },
    auditTrail: [
      { ts: '2026-05-15 11:00 UTC', type: 'claim_received', detail: 'FNOL submitted' },
      { ts: '2026-05-15 11:01 UTC', type: 'model_run',      modelVersion: 'claude-opus-4', confidence: 0.62, detail: 'Flagged: GATHER MORE INFO' },
    ],
  },

  // ── CLM-2026-00355 ── LOW confidence, full docs (failure case) ───────────
  {
    id: 'CLM-2026-00355',
    confidence: 0.34, tier: 'LOW',
    lob: 'Personal auto', fnolRelative: '27 days ago',
    recovery: 6100, recoveryBasis: 'Product liability (unsubstantiated)',
    solDate: '2026-08-10', solUrgent: false, solDays: 73, solState: 'CA',
    thesis: 'Single-vehicle DUI. Claimant attorney raises manufacturer steering-defect theory post-citation; ECU data and officer narrative directly contradict the defect claim. This assessment cannot support a subrogation demand.',
    action: 'REJECT', status: 'pending',
    thirdParty: { name: 'Honda Motor Co.', type: 'Manufacturer (alleged)', carrier: '[Unknown — litigation required]', identified: false },
    evidence: [
      { id: 1, docKey: 'Attorney Letter', source: 'Attorney Letter',
        quote: 'Our client experienced sudden, uncontrolled steering deviation with no prior warning, consistent with a known defect pattern reported in 2020–2021 Honda Civic models.',
        claim: 'Claimant attorney asserts manufacturer steering defect as proximate cause of loss.' },
    ],
    contradicting: [
      { id: 'C1', docKey: 'Police Report', source: 'Police Report',
        quote: 'Driver exhibited slurred speech and unsteady gait. Field sobriety test failed. BAC measured at 0.17% via breathalyzer at scene. Vehicle trajectory was consistent with impaired driving; no evidence of mechanical failure observed at scene.',
        claim: 'Officer narrative directly attributes loss of control to DUI, not mechanical failure.' },
      { id: 'C2', docKey: 'ECU Report', source: 'ECU Report',
        quote: 'No fault codes recorded in the 30-second window prior to impact. Steering angle sensor logs continuous driver input throughout. No anomalous signals detected.',
        claim: 'Vehicle electronics provide no support for sudden steering failure; sensor data shows consistent driver control inputs up to impact.' },
    ],
    warnings: [
      'DUI citation (Vehicle Code 23152(a)) is the primary cause of record — the manufacturer liability theory is attorney-constructed after the citation.',
      'ECU data directly refutes the sudden steering defect claim.',
      'Filing a subrogation demand without supporting evidence risks bad-faith exposure and potential counterclaim.',
    ],
    openQuestions: [
      'Has this attorney filed prior suits against Honda on this specific defect theory?',
    ],
    docs: {
      'FNOL': { parts: [
        { t: 'text', v: 'FIRST NOTICE OF LOSS — #FL-2026-00355\nFiled: 05/03/2026\n\nSingle-vehicle accident, 05/02/2026, US-101 southbound, San Jose CA.\nInsured: Dominic Alves  |  Policy: PA-331092\nVehicle: 2021 Honda Civic (CA 7MNK410)\n\nIncident: Vehicle departed roadway and struck median barrier. Insured cited at scene for DUI. No other parties involved.\n\nDamage: Front and driver-side impact. Vehicle totaled.\nFiled by: D. Kim, 05/03/2026 08:45 UTC' },
      ]},
      'Police Report': { parts: [
        { t: 'text', v: 'CALIFORNIA HIGHWAY PATROL — Incident Report\nReport #: CHP-2026-088142\nDate: 05/02/2026  |  Time: 22:14\nLocation: US-101 Southbound, San Jose CA\n\nResponding officer: T. Nguyen, Badge #8821\n\nParty: Dominic Alves, 2021 Honda Civic, CA 7MNK410\n\n' },
        { t: 'cv', id: 'C1', v: 'Driver exhibited slurred speech and unsteady gait. Field sobriety test failed. BAC measured at 0.17% via breathalyzer at scene. Vehicle trajectory was consistent with impaired driving; no evidence of mechanical failure observed at scene.' },
        { t: 'text', v: '\n\nCitations issued:\n— Vehicle Code 23152(a) — DUI\n\nVehicle sustained front and driver-side impact with median barrier.\nNo other vehicles or parties involved.\n\nReport finalized: 05/03/2026 01:00 UTC' },
      ]},
      'ECU Report': { parts: [
        { t: 'text', v: 'VEHICLE ELECTRONIC CONTROL UNIT — Data Extract\nExtracted: 05/05/2026  |  Claim: CLM-2026-00355\nVehicle: 2021 Honda Civic, VIN 2HGFE1F38MH000412\n\nPre-impact analysis window: T−30s to T−0s\n\n' },
        { t: 'cv', id: 'C2', v: 'No fault codes recorded in the 30-second window prior to impact. Steering angle sensor logs continuous driver input throughout. No anomalous signals detected.' },
        { t: 'text', v: '\n\nSpeed at T−0: estimated 51 MPH\nBrake application: none detected in final 4.2 seconds\nThrottle: stable in final 30s\n\nExtracted by: Cascade Forensic Auto, license #CFA-441\nDate: 05/05/2026' },
      ]},
      'Attorney Letter': { parts: [
        { t: 'text', v: 'LAW OFFICES OF BRENNAN & KWAN\n1200 Market St, Suite 800, San Francisco CA\nDate: 05/12/2026\n\nRe: CLM-2026-00355 — Notice of Representation & Litigation Hold\n\nDear Claims Department,\n\nThis firm represents Dominic Alves in connection with the above-referenced claim. We write to provide notice of representation and to assert that the incident of 05/02/2026 was caused in whole or in part by a defective steering component.\n\n' },
        { t: 'ev', id: 1, v: 'Our client experienced sudden, uncontrolled steering deviation with no prior warning, consistent with a known defect pattern reported in 2020–2021 Honda Civic models.' },
        { t: 'text', v: '\n\nWe demand immediate preservation of all vehicle data, inspection records, and related claim documentation pending litigation review.\n\nBrennan & Kwan LLP\n(415) 883-2200' },
      ]},
    },
    auditTrail: [
      { ts: '2026-05-02 22:45 UTC', type: 'claim_received', detail: 'FNOL submitted via phone' },
      { ts: '2026-05-05 10:00 UTC', type: 'claim_received', detail: 'ECU report received from forensic auto' },
      { ts: '2026-05-12 09:00 UTC', type: 'claim_received', detail: 'Attorney representation notice received' },
      { ts: '2026-05-13 08:30 UTC', type: 'model_run',      modelVersion: 'claude-opus-4', confidence: 0.34, detail: 'Flagged: REJECT — low subrogation confidence' },
    ],
  },

  // ── CLM-2026-00445 ── MEDIUM ─────────────────────────────────────────────
  {
    id: 'CLM-2026-00445',
    confidence: 0.71, tier: 'MEDIUM',
    lob: 'Personal auto', fnolRelative: '11 days ago',
    recovery: 5200, recoveryBasis: 'Repair + rental',
    solDate: '2027-09-30', solUrgent: false, solDays: 490, solState: 'WA',
    thesis: 'Multi-vehicle chain collision; third-party insurer disputes primary fault assignment. Liability split between parties requires adjuster review before routing.',
    action: 'GATHER_MORE_INFO', status: 'pending',
    thirdParty: { name: 'Marcus Patel', type: 'Named driver', carrier: 'NorthStar Mutual', identified: true },
    evidence: [], contradicting: [], warnings: [], openQuestions: ['Obtain comparative fault determination from adjuster.'],
    docs: { 'FNOL': { parts: [{ t: 'text', v: 'FNOL on file. Multi-vehicle chain collision, 05/18/2026.' }] } },
    auditTrail: [
      { ts: '2026-05-18 16:00 UTC', type: 'claim_received', detail: 'FNOL submitted' },
      { ts: '2026-05-18 16:01 UTC', type: 'model_run',      modelVersion: 'claude-opus-4', confidence: 0.71, detail: 'Flagged: GATHER MORE INFO' },
    ],
  },

  // ── CLM-2026-00492 ── ANALYSIS FAILED (error state) ────────────────────
  {
    id: 'CLM-2026-00492',
    confidence: null, tier: 'ERROR',
    lob: 'Commercial auto', fnolRelative: '2 days ago',
    recovery: null, recoveryBasis: '',
    solDate: null, solUrgent: false, solDays: null, solState: 'OR',
    thesis: null,
    action: null, status: 'error',
    errorMessage: 'Document parsing failed on FNOL upload — file was corrupted or unreadable. Resubmit a clean copy or route to manual review.',
    errorType: 'parse_failure',
    thirdParty: null,
    evidence: [], contradicting: [], warnings: [], openQuestions: [],
    docs: { 'FNOL': { parts: [{ t: 'text', v: '[Document unavailable — upload failed]' }] } },
    auditTrail: [
      { ts: '2026-05-27 11:00 UTC', type: 'claim_received', detail: 'FNOL submitted via portal' },
      { ts: '2026-05-27 11:01 UTC', type: 'model_run', modelVersion: 'claude-opus-4', confidence: null, detail: 'Error: document parsing failed on FNOL upload. No output produced.' },
    ],
  },

  // ── CLM-2026-00290 ── CONFIRMED (actioned, shown muted) ──────────────────
  {
    id: 'CLM-2026-00290',
    confidence: 0.89, tier: 'HIGH',
    lob: 'Personal auto', fnolRelative: '38 days ago',
    recovery: 4800, recoveryBasis: 'Repair (confirmed invoices)',
    solDate: '2028-01-15', solUrgent: false, solDays: 596, solState: 'OR',
    thesis: 'Lane change by named third party caused sideswipe at highway merge. Police report confirms fault assignment.',
    action: 'ROUTE_TO_DEMAND', status: 'confirmed',
    thirdParty: { name: 'Sophia Vega', type: 'Named driver', carrier: 'Bayshore Mutual Insurance', identified: true },
    evidence: [], contradicting: [], warnings: [], openQuestions: [],
    docs: { 'FNOL': { parts: [{ t: 'text', v: 'FNOL on file. Sideswipe collision, 04/21/2026.' }] } },
    auditTrail: [
      { ts: '2026-04-21 11:00 UTC', type: 'claim_received', detail: 'FNOL submitted' },
      { ts: '2026-04-21 11:01 UTC', type: 'model_run',      modelVersion: 'claude-opus-4', confidence: 0.89, detail: 'Flagged: ROUTE TO DEMAND LETTER' },
      { ts: '2026-04-22 10:14 UTC', type: 'reviewer_action', reviewer: 'Molly Shove', decision: 'CONFIRMED — ROUTED TO DEMAND LETTER', notes: 'Clean liability. Proceeding.' },
    ],
  },
];

// ── Audit Log ────────────────────────────────────────────────────────────────
window.AUDIT_LOG_INIT = [
  { ts: '2026-05-29 09:16 UTC', claimId: 'CLM-2026-00481', type: 'model_run',       modelVersion: 'claude-opus-4', reviewer: '',            action: 'ROUTE TO DEMAND LETTER', confidence: 0.92, notes: '' },
  { ts: '2026-05-29 09:15 UTC', claimId: 'CLM-2026-00481', type: 'claim_received',  modelVersion: '',              reviewer: '',            action: 'FNOL submitted',          confidence: null, notes: '' },
  { ts: '2026-05-28 17:22 UTC', claimId: 'CLM-2026-00467', type: 'model_run',       modelVersion: 'claude-opus-4', reviewer: '',            action: 'ROUTE TO DEMAND LETTER', confidence: 0.91, notes: '' },
  { ts: '2026-05-25 09:00 UTC', claimId: 'CLM-2026-00467', type: 'claim_received',  modelVersion: '',              reviewer: '',            action: 'FNOL submitted',          confidence: null, notes: '' },
  { ts: '2026-05-18 16:01 UTC', claimId: 'CLM-2026-00445', type: 'model_run',       modelVersion: 'claude-opus-4', reviewer: '',            action: 'GATHER MORE INFO',       confidence: 0.71, notes: 'Multi-vehicle fault split unresolved' },
  { ts: '2026-05-18 16:00 UTC', claimId: 'CLM-2026-00445', type: 'claim_received',  modelVersion: '',              reviewer: '',            action: 'FNOL submitted',          confidence: null, notes: '' },
  { ts: '2026-05-15 11:01 UTC', claimId: 'CLM-2026-00412', type: 'model_run',       modelVersion: 'claude-opus-4', reviewer: '',            action: 'GATHER MORE INFO',       confidence: 0.62, notes: 'Contractor identity unconfirmed' },
  { ts: '2026-05-15 11:00 UTC', claimId: 'CLM-2026-00412', type: 'claim_received',  modelVersion: '',              reviewer: '',            action: 'FNOL submitted',          confidence: null, notes: '' },
  { ts: '2026-05-13 08:30 UTC', claimId: 'CLM-2026-00355', type: 'model_run',       modelVersion: 'claude-opus-4', reviewer: '',            action: 'REJECT',                 confidence: 0.34, notes: 'DUI primary; defect theory unsupported by ECU' },
  { ts: '2026-05-12 09:00 UTC', claimId: 'CLM-2026-00355', type: 'claim_received',  modelVersion: '',              reviewer: '',            action: 'Attorney notice received', confidence: null, notes: '' },
  { ts: '2026-05-10 14:31 UTC', claimId: 'CLM-2026-00389', type: 'model_run',       modelVersion: 'claude-opus-4', reviewer: '',            action: 'ROUTE TO DEMAND LETTER', confidence: 0.87, notes: '' },
  { ts: '2026-05-10 14:30 UTC', claimId: 'CLM-2026-00389', type: 'claim_received',  modelVersion: '',              reviewer: '',            action: 'FNOL submitted',          confidence: null, notes: '' },
  { ts: '2026-04-22 10:14 UTC', claimId: 'CLM-2026-00290', type: 'reviewer_action', modelVersion: '',              reviewer: 'Molly Shove', action: 'CONFIRMED — ROUTED TO DEMAND LETTER', confidence: null, notes: 'Clean liability. Proceeding.' },
  { ts: '2026-04-21 11:01 UTC', claimId: 'CLM-2026-00290', type: 'model_run',       modelVersion: 'claude-opus-4', reviewer: '',            action: 'ROUTE TO DEMAND LETTER', confidence: 0.89, notes: '' },
  { ts: '2026-04-21 11:00 UTC', claimId: 'CLM-2026-00290', type: 'claim_received',  modelVersion: '',              reviewer: '',            action: 'FNOL submitted',          confidence: null, notes: '' },
];

// ── New-claim templates for "Drop a claim" modal ─────────────────────────────
window.NEW_CLAIM_TEMPLATES = {
  straightforward: {
    id: 'CLM-2026-00488',
    confidence: 0.92, tier: 'HIGH',
    lob: 'Personal auto', fnolRelative: 'Just now',
    recovery: 8500, recoveryBasis: 'Repair + rental (estimated from FNOL)',
    solDate: '2028-05-29', solUrgent: false, solDays: 730, solState: 'OR',
    thesis: 'Named third party rear-ended insured at a controlled intersection. Citations issued; third party made verbal admission of fault at scene.',
    action: 'ROUTE_TO_DEMAND', status: 'pending',
    thirdParty: { name: 'Dale Fenton', type: 'Named driver', carrier: 'Summit Casualty Group', identified: true },
    evidence: [
      { id: 1, docKey: 'FNOL', source: 'FNOL',
        quote: 'Third party was issued a citation for failure to stop at a red light. He stated to the responding officer: "I didn\'t see it in time."',
        claim: 'Third party received citation and made a spontaneous admission of fault at scene.' },
      { id: 2, docKey: 'FNOL', source: 'FNOL',
        quote: 'Insured vehicle was at a complete stop for approximately 5–8 seconds prior to impact. Estimated impact speed 25–30 MPH.',
        claim: 'Confirms insured was stationary — no basis for comparative fault.' },
    ],
    contradicting: [],
    warnings: [],
    openQuestions: ['Request formal repair estimate from authorized shop.'],
    docs: { 'FNOL': { parts: [{ t: 'text', v: 'FNOL on file. Personal auto rear-end collision, 05/29/2026.' }] } },
    auditTrail: [{ ts: '2026-05-29 09:41 UTC', type: 'model_run', modelVersion: 'claude-opus-4', confidence: 0.92, detail: 'Flagged: ROUTE TO DEMAND LETTER' }],
  },
  ambiguous: {
    id: 'CLM-2026-00489',
    confidence: 0.58, tier: 'MEDIUM',
    lob: 'General liability', fnolRelative: 'Just now',
    recovery: 4200, recoveryBasis: 'Medical + lost wages (estimated)',
    solDate: '2027-05-29', solUrgent: false, solDays: 365, solState: 'WA',
    thesis: 'Slip-and-fall on premises maintained by an unidentified subcontractor. Property owner acknowledges contractor responsibility but cannot name the party. Subrogation is plausible but unactionable without contractor identification.',
    action: 'GATHER_MORE_INFO', status: 'pending',
    thirdParty: { name: '[Unconfirmed]', type: 'Contractor (unverified)', carrier: '[Unknown]', identified: false },
    evidence: [
      { id: 1, docKey: 'FNOL', source: 'FNOL',
        quote: '"That section of walkway is handled by our contractor, not us. They come every other week."',
        claim: 'Property owner verbally attributes maintenance responsibility to a third-party contractor, supporting subrogation theory.' },
    ],
    contradicting: [
      { id: 'C1', docKey: 'FNOL', source: 'FNOL',
        quote: 'Building management could not produce a written maintenance contract or provide the contractor\'s name when pressed.',
        claim: 'Without a named party and verified insurer, a subrogation demand cannot be issued.' },
    ],
    warnings: ['Subrogation demand cannot be issued without a named, insured third party.'],
    openQuestions: ['Identify the maintenance contractor by name and liability insurer.', 'Obtain written or email record of maintenance arrangement.'],
    docs: { 'FNOL': { parts: [{ t: 'text', v: 'FNOL on file. General liability slip-and-fall, 05/29/2026.' }] } },
    auditTrail: [{ ts: '2026-05-29 09:41 UTC', type: 'model_run', modelVersion: 'claude-opus-4', confidence: 0.58, detail: 'Flagged: GATHER MORE INFO' }],
  },
  failure: {
    id: 'CLM-2026-00490',
    confidence: 0.29, tier: 'LOW',
    lob: 'Personal auto', fnolRelative: 'Just now',
    recovery: 7100, recoveryBasis: 'Product liability (unsubstantiated)',
    solDate: '2026-09-15', solUrgent: false, solDays: 109, solState: 'CA',
    thesis: 'Single-vehicle DUI. Attorney asserts sudden unintended acceleration by manufacturer; ECU data and officer narrative directly contradict. This assessment cannot support a subrogation demand.',
    action: 'REJECT', status: 'pending',
    thirdParty: { name: 'Kia Motors America', type: 'Manufacturer (alleged)', carrier: '[Unknown — litigation required]', identified: false },
    evidence: [
      { id: 1, docKey: 'Attorney Letter', source: 'Attorney Letter',
        quote: 'Our client maintains that the vehicle accelerated without driver input immediately before the collision — a pattern previously reported in this model year.',
        claim: 'Attorney asserts sudden unintended acceleration as proximate cause of loss.' },
    ],
    contradicting: [
      { id: 'C1', docKey: 'Police Report', source: 'Police Report',
        quote: 'Driver BAC was 0.19% at scene. Vehicle path consistent with impaired driving across two lanes before impact with barrier. No skid marks or evasive action detected.',
        claim: 'Officer attributes cause to DUI, not mechanical failure.' },
      { id: 'C2', docKey: 'ECU Report', source: 'ECU Report',
        quote: 'Throttle position sensor normal throughout event window. No fault codes. Brakes not applied in the 6 seconds before impact. No anomalous acceleration event recorded.',
        claim: 'Vehicle electronics provide no support for sudden unintended acceleration.' },
    ],
    warnings: [
      'Primary cause of record is DUI (Vehicle Code 23152) — manufacturer liability is attorney-constructed post-citation.',
      'ECU data directly refutes the unintended acceleration theory.',
      'Filing a demand without supporting evidence risks bad-faith exposure and a counterclaim.',
    ],
    openQuestions: ['Has this attorney filed prior SUA claims against this vehicle model?'],
    docs: {
      'FNOL':          { parts: [{ t: 'text', v: 'FNOL on file. Single-vehicle accident, 05/29/2026.' }] },
      'Police Report': { parts: [{ t: 'text', v: 'Police report on file. DUI citation issued.' }] },
      'ECU Report':    { parts: [{ t: 'text', v: 'ECU report on file. No fault codes detected.' }] },
      'Attorney Letter': { parts: [{ t: 'text', v: 'Attorney representation notice on file.' }] },
    },
    auditTrail: [{ ts: '2026-05-29 09:41 UTC', type: 'model_run', modelVersion: 'claude-opus-4', confidence: 0.29, detail: 'Flagged: REJECT — low subrogation confidence' }],
  },
};
