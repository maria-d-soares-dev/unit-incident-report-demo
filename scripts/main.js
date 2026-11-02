"use strict";

const CONFIG = {
    storageKeys: {
        theme: "unit-theme",
        draft: "unit-incident-draft"
    },
    draftVersion: 1,
    autoSaveDelay: 800,
    transmissionDelay: 700,
    threatScores: {
        incidentType: {
            extraterrestrial: 2,
            temporal: 3,
            "unknown-technology": 2,
            "unidentified-creature": 2,
            "missing-person": 2,
            other: 1
        },
        doctorPresence: {
            confirmed: 2,
            possible: 1,
            "not-observed": 0,
            unknown: 0
        },
        evidence: {
            photographs: 1,
            "video-recording": 2,
            "audio-recording": 1,
            "physical-object": 3,
            "other-witnesses": 1
        }
    }
};

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

const form = $("#incident-form");

const elements = {
    themeButton: $("#theme-toggle"),
    themeIcon: $("#theme-icon"),
    themeText: $("#theme-text"),
    draftStatus: $("#draft-status"),
    saveDraftButton: $("#save-draft"),
    saveDraftBottomButton: $("#save-draft-bottom"),
    deleteDraftButton: $("#delete-draft"),
    stepStatus: $("#step-status"),
    progressBar: $("#progress-bar"),
    progressContainer: $(".form-progress .progress"),
    previousStepButton: $("#previous-step"),
    nextStepButton: $("#next-step"),
    reviewReportButton: $("#review-report"),
    resetButton: $("#delete-report"),
    fullNameInput: $("#full-name"),
    phoneInput: $("#phone"),
    phoneHelp: $("#phone-help"),
    birthDateInput: $("#birth-date"),
    incidentDateInput: $("#incident-date"),
    incidentTypeSelect: $("#incident-type"),
    missingPersonDetails: $("#missing-person-details"),
    temporalDetails: $("#temporal-details"),
    missingPeopleCount: $("#missing-people-count"),
    lastKnownContact: $("#last-known-contact"),
    perceivedDate: $("#perceived-date"),
    temporalDisplacement: $("#temporal-displacement"),
    globalRiskConfirmation: $("#global-risk-confirmation"),
    confirmGlobalRisk: $("#confirm-global-risk"),
    doctorDetails: $("#doctor-details"),
    previousDoctorContact: $("#previous-doctor-contact"),
    videoRecording: $("#video-recording"),
    physicalObject: $("#physical-object"),
    otherWitnesses: $("#other-witnesses"),
    videoDetails: $("#video-details"),
    physicalObjectDetails: $("#physical-object-details"),
    witnessDetails: $("#witness-details"),
    videoDuration: $("#video-duration"),
    recordingDevice: $("#recording-device"),
    objectContainment: $("#object-containment"),
    witnessCount: $("#witness-count"),
    timelineTime: $("#timeline-time"),
    timelineDescription: $("#timeline-description"),
    addTimelineEventButton: $("#add-timeline-event"),
    timelineList: $("#timeline-list"),
    suggestedThreat: $("#suggested-threat"),
    selectedThreat: $("#selected-threat"),
    threatScore: $("#threat-score"),
    threatReasons: $("#threat-reasons"),
    reviewPreviewContent: $("#review-preview-content"),
    reviewContent: $("#review-content"),
    confirmTransmissionButton: $("#confirm-transmission"),
    reportReference: $("#report-reference"),
    statusMessage: $("#form-status")
};

const formSteps = $$(".form-step");

const threatLevelInputs =
    $$("input[name='threatLevel']");

const doctorPresenceInputs =
    $$("input[name='doctorPresence']");

const state = {
    currentStep: 0,
    timeline: [],
    autoSaveTimer: null,
    isRestoringDraft: false,
    lastAssessment: null,
    isTransmitting: false
};

function showStatus(message, type = "info") {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `alert alert-${type}`;
}

function clearStatus() {
    elements.statusMessage.textContent = "";
    elements.statusMessage.className = "alert d-none";
}

function clearElement(element) {
    element.replaceChildren();
}

function getScrollBehavior() {
    return window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches
        ? "auto"
        : "smooth";
}

function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDateTime(date) {
    return new Intl.DateTimeFormat(
        document.documentElement.lang || "en",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(date);
}

function formatReadableValue(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "Not provided";
    }

    return String(value)
        .replaceAll("-", " ")
        .replace(
            /\b\w/g,
            character => character.toUpperCase()
        );
}

function readStoredJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);

        return value
            ? JSON.parse(value)
            : fallback;
    } catch (error) {
        console.error(
            `Unable to read "${key}".`,
            error
        );

        return fallback;
    }
}

function writeStoredJSON(key, value) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;
    } catch (error) {
        console.error(
            `Unable to write "${key}".`,
            error
        );

        return false;
    }
}

function createUniqueId() {
    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {
        return window.crypto.randomUUID();
    }

    const bytes = new Uint8Array(16);

    if (window.crypto?.getRandomValues) {
        window.crypto.getRandomValues(bytes);
    } else {
        for (
            let index = 0;
            index < bytes.length;
            index += 1
        ) {
            bytes[index] =
                Math.floor(Math.random() * 256);
        }
    }

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hexadecimal = Array.from(
        bytes,
        byte => byte
            .toString(16)
            .padStart(2, "0")
    ).join("");

    return [
        hexadecimal.slice(0, 8),
        hexadecimal.slice(8, 12),
        hexadecimal.slice(12, 16),
        hexadecimal.slice(16, 20),
        hexadecimal.slice(20)
    ].join("-");
}

function getInitialTheme() {
    const savedTheme = localStorage.getItem(
        CONFIG.storageKeys.theme
    );

    if (
        savedTheme === "light" ||
        savedTheme === "dark"
    ) {
        return savedTheme;
    }

    return window.matchMedia(
        "(prefers-color-scheme: light)"
    ).matches
        ? "light"
        : "dark";
}

function applyTheme(theme) {
    const light = theme === "light";

    document.body.dataset.theme = theme;

    elements.themeButton.setAttribute(
        "aria-pressed",
        String(light)
    );

    elements.themeIcon.textContent =
        light ? "☾" : "☀";

    elements.themeText.textContent =
        light ? "Dark theme" : "Light theme";

    elements.themeButton.setAttribute(
        "aria-label",
        light
            ? "Switch to dark theme"
            : "Switch to light theme"
    );
}

function toggleTheme() {
    const theme =
        document.body.dataset.theme === "light"
            ? "dark"
            : "light";

    applyTheme(theme);

    localStorage.setItem(
        CONFIG.storageKeys.theme,
        theme
    );
}

function configureDateLimits() {
    const today = getLocalDateString(new Date());

    elements.birthDateInput.max = today;
    elements.incidentDateInput.max = today;
}

function normalizeInternationalPhone(value) {
    const trimmed = value.trim();
    const digits = trimmed.replace(/\D/g, "");

    return trimmed.startsWith("+") && digits
        ? `+${digits}`
        : digits;
}

function isValidInternationalPhone(value) {
    return /^\+[1-9]\d{7,14}$/.test(
        normalizeInternationalPhone(value)
    );
}

function validatePhone() {
    const value =
        elements.phoneInput.value.trim();

    elements.phoneInput.setCustomValidity("");

    elements.phoneHelp.classList.remove(
        "field-help-error"
    );

    if (
        value &&
        !isValidInternationalPhone(value)
    ) {
        elements.phoneInput.setCustomValidity(
            "Enter an international telephone number " +
            "with a country calling code, for example " +
            "+44 20 7946 0958."
        );

        elements.phoneHelp.classList.add(
            "field-help-error"
        );
    }
}

function sanitizePhoneInput() {
    let value = elements.phoneInput.value.replace(
        /[^\d+\-()\s]/g,
        ""
    );

    const leadingPlus = value.startsWith("+");

    value = value.replace(/\+/g, "");

    elements.phoneInput.value =
        leadingPlus ? `+${value}` : value;

    validatePhone();
}

function normalizePhoneAfterEditing() {
    if (
        isValidInternationalPhone(
            elements.phoneInput.value
        )
    ) {
        elements.phoneInput.value =
            normalizeInternationalPhone(
                elements.phoneInput.value
            );
    }

    validatePhone();
}

function createCharacterCounter(textarea) {
    if (
        !textarea ||
        textarea.maxLength < 1 ||
        textarea.dataset.counterCreated
    ) {
        return;
    }

    const counter =
        document.createElement("small");

    counter.className = "character-counter";
    counter.setAttribute(
        "aria-live",
        "polite"
    );

    textarea.insertAdjacentElement(
        "afterend",
        counter
    );

    textarea.dataset.counterCreated = "true";

    const update = () => {
        const used = textarea.value.length;

        counter.textContent =
            `${used} / ${textarea.maxLength} characters`;

        counter.classList.toggle(
            "character-limit-warning",
            used >= textarea.maxLength * 0.9
        );
    };

    textarea.addEventListener(
        "input",
        update
    );

    update();
}

function updateAllCharacterCounters() {
    $$("textarea", form).forEach(textarea => {
        textarea.dispatchEvent(
            new Event(
                "input",
                { bubbles: true }
            )
        );
    });
}

function setSectionVisibility(
    section,
    shouldShow
) {
    section.hidden = !shouldShow;

    $$(
        "input, select, textarea",
        section
    ).forEach(field => {
        field.disabled = !shouldShow;
    });
}

function clearSection(section) {
    $$(
        "input, select, textarea",
        section
    ).forEach(field => {
        if (
            field.type === "checkbox" ||
            field.type === "radio"
        ) {
            field.checked = false;
        } else {
            field.value = "";
        }

        field.setCustomValidity("");
    });

    $$("textarea", section).forEach(textarea => {
        textarea.dispatchEvent(
            new Event(
                "input",
                { bubbles: true }
            )
        );
    });
}

function setRequired(fields, required) {
    fields.forEach(field => {
        field.required = required;
    });
}

function updateIncidentTypeDetails(
    { clearHidden = true } = {}
) {
    const type =
        elements.incidentTypeSelect.value;

    const showMissing =
        type === "missing-person";

    const showTemporal =
        type === "temporal";

    setSectionVisibility(
        elements.missingPersonDetails,
        showMissing
    );

    setSectionVisibility(
        elements.temporalDetails,
        showTemporal
    );

    setRequired(
        [
            elements.missingPeopleCount,
            elements.lastKnownContact
        ],
        showMissing
    );

    setRequired(
        [
            elements.perceivedDate,
            elements.temporalDisplacement
        ],
        showTemporal
    );

    if (
        clearHidden &&
        !showMissing
    ) {
        clearSection(
            elements.missingPersonDetails
        );
    }

    if (
        clearHidden &&
        !showTemporal
    ) {
        clearSection(
            elements.temporalDetails
        );
    }
}

function updateGlobalRiskConfirmation(
    { clearHidden = true } = {}
) {
    const selected = $(
        "input[name='threatLevel']:checked",
        form
    );

    const show =
        selected?.value === "global";

    setSectionVisibility(
        elements.globalRiskConfirmation,
        show
    );

    elements.confirmGlobalRisk.required = show;

    if (
        clearHidden &&
        !show
    ) {
        clearSection(
            elements.globalRiskConfirmation
        );
    }
}

function updateDoctorDetails(
    { clearHidden = true } = {}
) {
    const selected = $(
        "input[name='doctorPresence']:checked",
        form
    );

    const show =
        selected?.value === "confirmed" ||
        selected?.value === "possible";

    setSectionVisibility(
        elements.doctorDetails,
        show
    );

    elements.previousDoctorContact.required =
        show;

    doctorPresenceInputs.forEach(radio => {
        radio.setAttribute(
            "aria-expanded",
            String(show)
        );
    });

    if (
        clearHidden &&
        !show
    ) {
        clearSection(elements.doctorDetails);
    }
}

function updateVideoDetails(
    { clearHidden = true } = {}
) {
    const show =
        elements.videoRecording.checked;

    setSectionVisibility(
        elements.videoDetails,
        show
    );

    elements.videoDuration.required = show;
    elements.recordingDevice.required = show;

    if (
        clearHidden &&
        !show
    ) {
        clearSection(elements.videoDetails);
    }
}

function updatePhysicalObjectDetails(
    { clearHidden = true } = {}
) {
    const show =
        elements.physicalObject.checked;

    setSectionVisibility(
        elements.physicalObjectDetails,
        show
    );

    elements.objectContainment.required = show;

    if (
        clearHidden &&
        !show
    ) {
        clearSection(
            elements.physicalObjectDetails
        );
    }
}

function getWitnessContactInputs() {
    return $$(
        "input[name='witnessContact']",
        form
    );
}

function updateWitnessDetails(
    { clearHidden = true } = {}
) {
    const show =
        elements.otherWitnesses.checked;

    setSectionVisibility(
        elements.witnessDetails,
        show
    );

    elements.witnessCount.required = show;

    setRequired(
        getWitnessContactInputs(),
        show
    );

    if (
        clearHidden &&
        !show
    ) {
        clearSection(
            elements.witnessDetails
        );
    }
}

function updateAllConditionalSections(
    options = {}
) {
    updateIncidentTypeDetails(options);
    updateGlobalRiskConfirmation(options);
    updateDoctorDetails(options);
    updateVideoDetails(options);
    updatePhysicalObjectDetails(options);
    updateWitnessDetails(options);
}

function getCheckedValues(name) {
    return $$(
        `input[name="${name}"]:checked`,
        form
    ).map(input => input.value);
}

function getSelectedRadioValue(name) {
    return $(
        `input[name="${name}"]:checked`,
        form
    )?.value || "";
}

function collectFormFields() {
    const fields = {};

    $$(
        "input[name], select[name], textarea[name]",
        form
    ).forEach(field => {
        if (field.disabled) {
            return;
        }

        if (field.type === "radio") {
            if (!(field.name in fields)) {
                fields[field.name] = "";
            }

            if (field.checked) {
                fields[field.name] = field.value;
            }

            return;
        }

        if (field.type === "checkbox") {
            if (field.name.endsWith("[]")) {
                if (
                    !Array.isArray(
                        fields[field.name]
                    )
                ) {
                    fields[field.name] = [];
                }

                if (field.checked) {
                    fields[field.name].push(
                        field.value
                    );
                }
            } else {
                fields[field.name] =
                    field.checked;
            }

            return;
        }

        fields[field.name] = field.value;
    });

    return fields;
}

function restoreFormFields(fields) {
    $$(
        "input[name], select[name], textarea[name]",
        form
    ).forEach(field => {
        const value = fields[field.name];

        if (value === undefined) {
            return;
        }

        if (field.type === "radio") {
            field.checked =
                value === field.value;
        } else if (
            field.type === "checkbox"
        ) {
            field.checked =
                field.name.endsWith("[]")
                    ? Array.isArray(value) &&
                    value.includes(field.value)
                    : Boolean(value);
        } else {
            field.value = value;
        }
    });
}

function addTimelineEvent(
    time,
    description
) {
    const cleanTime = time.trim();

    const cleanDescription =
        description.trim();

    if (
        !cleanTime ||
        !cleanDescription
    ) {
        showStatus(
            "Enter both a time and an event description.",
            "warning"
        );

        (
            !cleanTime
                ? elements.timelineTime
                : elements.timelineDescription
        ).focus();

        return;
    }

    state.timeline.push({
        id: createUniqueId(),
        time: cleanTime,
        description: cleanDescription
    });

    state.timeline.sort(
        (first, second) =>
            first.time.localeCompare(
                second.time
            )
    );

    elements.timelineTime.value = "";

    elements.timelineDescription.value = "";

    renderTimeline();
    scheduleAutoSave();
    clearStatus();

    elements.timelineTime.focus();
}

function removeTimelineEvent(id) {
    state.timeline =
        state.timeline.filter(
            event => event.id !== id
        );

    renderTimeline();
    scheduleAutoSave();
}

function renderTimeline() {
    clearElement(elements.timelineList);

    state.timeline.forEach(event => {
        const item =
            document.createElement("li");

        const content =
            document.createElement("div");

        const text =
            document.createElement("div");

        const time =
            document.createElement("time");

        const description =
            document.createElement("p");

        const remove =
            document.createElement("button");

        item.className = "timeline-item";

        content.className =
            "timeline-item-content";

        time.textContent = event.time;
        time.dateTime = event.time;

        description.textContent =
            event.description;

        remove.type = "button";
        remove.textContent = "Remove";

        remove.dataset.timelineId =
            event.id;

        text.append(
            time,
            description
        );

        content.append(
            text,
            remove
        );

        item.append(content);

        elements.timelineList.append(item);
    });
}

function setDraftStatus(
    message,
    status = ""
) {
    elements.draftStatus.textContent =
        message;

    elements.draftStatus.classList.remove(
        "draft-status-unsaved",
        "draft-status-saving",
        "draft-status-saved",
        "draft-status-error"
    );

    if (status) {
        elements.draftStatus.classList.add(
            `draft-status-${status}`
        );
    }
}

function createDraft() {
    return {
        version: CONFIG.draftVersion,
        savedAt: new Date().toISOString(),
        currentStep: state.currentStep,
        fields: collectFormFields(),
        timeline: state.timeline
    };
}

function saveDraft(
    { silent = false } = {}
) {
    setDraftStatus(
        "Saving draft...",
        "saving"
    );

    const saved = writeStoredJSON(
        CONFIG.storageKeys.draft,
        createDraft()
    );

    if (!saved) {
        setDraftStatus(
            "The draft could not be saved.",
            "error"
        );

        if (!silent) {
            showStatus(
                "The browser could not save the local draft.",
                "danger"
            );
        }

        return false;
    }

    setDraftStatus(
        `Draft saved locally at ${
            formatDateTime(new Date())
        }.`,
        "saved"
    );

    if (!silent) {
        showStatus(
            "The draft was saved only in this browser.",
            "info"
        );
    }

    return true;
}

function scheduleAutoSave() {
    if (
        state.isRestoringDraft ||
        state.isTransmitting
    ) {
        return;
    }

    setDraftStatus(
        "Unsaved changes.",
        "unsaved"
    );

    clearTimeout(state.autoSaveTimer);

    state.autoSaveTimer = setTimeout(
        () => {
            saveDraft({ silent: true });
        },
        CONFIG.autoSaveDelay
    );
}

function deleteLocalDraft(
    { askForConfirmation = true } = {}
) {
    if (
        askForConfirmation &&
        !window.confirm(
            "Delete the locally saved draft? " +
            "The current form will remain open."
        )
    ) {
        return false;
    }

    localStorage.removeItem(
        CONFIG.storageKeys.draft
    );

    setDraftStatus(
        "No local draft has been saved."
    );

    if (askForConfirmation) {
        showStatus(
            "The local draft was deleted. " +
            "The current form was not cleared.",
            "info"
        );
    }

    return true;
}

function restoreDraft(draft) {
    if (
        !draft ||
        draft.version !==
        CONFIG.draftVersion ||
        !draft.fields
    ) {
        return false;
    }

    state.isRestoringDraft = true;

    restoreFormFields(draft.fields);

    state.timeline =
        Array.isArray(draft.timeline)
            ? draft.timeline
            : [];

    updateAllConditionalSections({
        clearHidden: false
    });

    renderTimeline();
    updateAllCharacterCounters();

    state.currentStep =
        Number.isInteger(draft.currentStep)
            ? Math.min(
                Math.max(
                    draft.currentStep,
                    0
                ),
                formSteps.length - 1
            )
            : 0;

    showStep(
        state.currentStep,
        { focus: false }
    );

    state.isRestoringDraft = false;

    const savedDate =
        new Date(draft.savedAt);

    setDraftStatus(
        Number.isNaN(savedDate.getTime())
            ? "A local draft was restored."
            : `Draft restored from ${
                formatDateTime(savedDate)
            }.`,
        "saved"
    );

    return true;
}

function offerDraftRestoration() {
    const draft = readStoredJSON(
        CONFIG.storageKeys.draft,
        null
    );

    if (!draft) {
        return;
    }

    if (
        window.confirm(
            "A local UNIT report draft was found. Restore it?"
        )
    ) {
        if (restoreDraft(draft)) {
            showStatus(
                "The local draft was restored.",
                "info"
            );
        } else {
            localStorage.removeItem(
                CONFIG.storageKeys.draft
            );

            setDraftStatus(
                "The saved draft was incompatible and was removed.",
                "error"
            );
        }
    } else {
        setDraftStatus(
            "A local draft exists but was not restored.",
            "unsaved"
        );
    }
}

function getCurrentStep() {
    return formSteps[state.currentStep];
}

function showStep(
    index,
    { focus = true } = {}
) {
    state.currentStep = Math.min(
        Math.max(index, 0),
        formSteps.length - 1
    );

    formSteps.forEach(
        (step, stepIndex) => {
            step.hidden =
                stepIndex !==
                state.currentStep;
        }
    );

    const active = getCurrentStep();

    const visibleNumber =
        state.currentStep + 1;

    const progress =
        visibleNumber /
        formSteps.length *
        100;

    elements.stepStatus.textContent =
        `Step ${visibleNumber} of ` +
        `${formSteps.length}: ` +
        `${active.dataset.stepName}`;

    elements.progressContainer.setAttribute(
        "aria-valuenow",
        String(visibleNumber)
    );

    elements.progressBar.style.width =
        `${progress}%`;

    elements.previousStepButton.hidden =
        state.currentStep === 0;

    const last =
        state.currentStep ===
        formSteps.length - 1;

    elements.nextStepButton.hidden = last;

    elements.reviewReportButton.hidden =
        !last;

    if (last) {
        updateThreatAssessment();
        renderReviewPreview();
    }

    if (focus) {
        active.scrollIntoView({
            behavior: getScrollBehavior(),
            block: "start"
        });

        $(
            "input:not([disabled]), " +
            "select:not([disabled]), " +
            "textarea:not([disabled]), " +
            "button:not([disabled])",
            active
        )?.focus({
            preventScroll: true
        });
    }
}

function findFirstInvalidField(container) {
    return $$(
        "input:not([disabled]), " +
        "select:not([disabled]), " +
        "textarea:not([disabled])",
        container
    ).find(
        field => !field.checkValidity()
    );
}

function validateStep(step) {
    validatePhone();

    const invalid =
        findFirstInvalidField(step);

    if (!invalid) {
        return true;
    }

    form.classList.add("was-validated");

    showStatus(
        "Complete the highlighted fields before continuing.",
        "danger"
    );

    invalid.scrollIntoView({
        behavior: getScrollBehavior(),
        block: "center"
    });

    invalid.focus({
        preventScroll: true
    });

    invalid.reportValidity();

    return false;
}

function moveToNextStep() {
    if (
        !validateStep(getCurrentStep())
    ) {
        return;
    }

    clearStatus();

    showStep(state.currentStep + 1);

    scheduleAutoSave();
}

function moveToPreviousStep() {
    clearStatus();

    showStep(state.currentStep - 1);

    scheduleAutoSave();
}

function showStepContainingField(field) {
    const step =
        field.closest(".form-step");

    const index =
        formSteps.indexOf(step);

    if (index >= 0) {
        showStep(
            index,
            { focus: false }
        );
    }
}

function calculateThreatAssessment() {
    let score = 0;

    const reasons = [];

    const type =
        elements.incidentTypeSelect.value;

    const doctor =
        getSelectedRadioValue(
            "doctorPresence"
        );

    const evidence =
        getCheckedValues("evidence[]");

    const typeScore =
        CONFIG.threatScores
            .incidentType[type] || 0;

    if (typeScore) {
        score += typeScore;

        reasons.push(
            `${formatReadableValue(type)} ` +
            `incident: +${typeScore}`
        );
    }

    const doctorScore =
        CONFIG.threatScores
            .doctorPresence[doctor] || 0;

    if (doctorScore) {
        score += doctorScore;

        reasons.push(
            `${formatReadableValue(doctor)} ` +
            `Doctor involvement: ` +
            `+${doctorScore}`
        );
    }

    evidence.forEach(item => {
        const evidenceScore =
            CONFIG.threatScores
                .evidence[item] || 0;

        if (evidenceScore) {
            score += evidenceScore;

            reasons.push(
                `${formatReadableValue(item)}: ` +
                `+${evidenceScore}`
            );
        }
    });

    return {
        score,
        suggestedThreat:
            score >= 9
                ? "global"
                : score >= 6
                    ? "high"
                    : score >= 3
                        ? "moderate"
                        : "low",
        selectedThreat:
            getSelectedRadioValue(
                "threatLevel"
            ),
        reasons
    };
}

function updateThreatAssessment() {
    const assessment =
        calculateThreatAssessment();

    state.lastAssessment = assessment;

    elements.suggestedThreat.textContent =
        formatReadableValue(
            assessment.suggestedThreat
        );

    elements.selectedThreat.textContent =
        formatReadableValue(
            assessment.selectedThreat
        );

    elements.threatScore.textContent =
        String(assessment.score);

    clearElement(
        elements.threatReasons
    );

    const reasons =
        assessment.reasons.length
            ? assessment.reasons
            : [
                "No scoring factors are currently available."
            ];

    reasons.forEach(reason => {
        const item =
            document.createElement("li");

        item.textContent = reason;

        elements.threatReasons.append(item);
    });

    return assessment;
}

function addReviewRow(
    list,
    label,
    value
) {
    const term =
        document.createElement("dt");

    const description =
        document.createElement("dd");

    term.textContent = label;

    description.textContent =
        value || "Not provided";

    list.append(
        term,
        description
    );
}

function createReviewGroup(
    title,
    rows
) {
    const group =
        document.createElement("section");

    const heading =
        document.createElement("h4");

    const list =
        document.createElement("dl");

    group.className = "review-group";
    heading.textContent = title;

    rows.forEach(row => {
        addReviewRow(
            list,
            row.label,
            row.value
        );
    });

    group.append(
        heading,
        list
    );

    return group;
}

function getReviewGroups() {
    const fields = collectFormFields();

    const assessment =
        state.lastAssessment ||
        calculateThreatAssessment();

    const timeline =
        state.timeline.length
            ? state.timeline
                .map(
                    event =>
                        `${event.time} — ` +
                        `${event.description}`
                )
                .join("\n")
            : "No timeline events";

    return [
        {
            title:
                "Witness Identification",
            rows: [
                {
                    label: "Full name",
                    value: fields.fullName
                },
                {
                    label: "E-mail",
                    value: fields.email
                },
                {
                    label: "Telephone",
                    value: fields.phone
                },
                {
                    label: "Date of birth",
                    value: fields.birthDate
                }
            ]
        },
        {
            title: "Incident",
            rows: [
                {
                    label: "Incident date",
                    value:
                    fields.incidentDate
                },
                {
                    label: "Incident type",
                    value:
                        formatReadableValue(
                            fields.incidentType
                        )
                },
                {
                    label: "Location",
                    value: fields.location
                },
                {
                    label:
                        "Selected threat",
                    value:
                        formatReadableValue(
                            fields.threatLevel
                        )
                },
                {
                    label:
                        "Suggested threat",
                    value:
                        formatReadableValue(
                            assessment
                                .suggestedThreat
                        )
                },
                {
                    label: "Description",
                    value:
                    fields.incidentReport
                },
                {
                    label: "Timeline",
                    value: timeline
                }
            ]
        },
        {
            title: "Doctor Involvement",
            rows: [
                {
                    label: "Presence",
                    value:
                        formatReadableValue(
                            fields.doctorPresence
                        )
                },
                {
                    label:
                        "Previous contact",
                    value:
                        formatReadableValue(
                            fields
                                .previousDoctorContact
                        )
                },
                {
                    label: "Observations",
                    value:
                        fields[
                            "doctorEvidence[]"
                            ]?.map(
                            formatReadableValue
                        ).join(", ") ||
                        "None selected"
                },
                {
                    label: "Description",
                    value:
                        fields.doctorDescription ||
                        "Not provided"
                }
            ]
        },
        {
            title: "Evidence",
            rows: [
                {
                    label:
                        "Available evidence",
                    value:
                        fields[
                            "evidence[]"
                            ]?.map(
                            formatReadableValue
                        ).join(", ") ||
                        "None selected"
                },
                {
                    label: "Video duration",
                    value:
                        fields.videoDuration
                            ? `${fields.videoDuration} seconds`
                            : "Not provided"
                },
                {
                    label:
                        "Recording device",
                    value:
                        fields.recordingDevice ||
                        "Not provided"
                },
                {
                    label:
                        "Object isolated",
                    value:
                        fields.objectIsolated
                            ? "Yes"
                            : "No or unknown"
                },
                {
                    label:
                        "Additional witnesses",
                    value:
                        fields.witnessCount ||
                        "Not provided"
                }
            ]
        }
    ];
}

function renderReviewInto(container) {
    clearElement(container);

    getReviewGroups().forEach(group => {
        container.append(
            createReviewGroup(
                group.title,
                group.rows
            )
        );
    });
}

function renderReviewPreview() {
    renderReviewInto(
        elements.reviewPreviewContent
    );
}

function renderReviewModal() {
    renderReviewInto(
        elements.reviewContent
    );
}

function getBootstrapModal(element) {
    if (
        !element ||
        !window.bootstrap?.Modal
    ) {
        return null;
    }

    return window.bootstrap.Modal
        .getOrCreateInstance(element);
}

function openReviewModal() {
    renderReviewModal();

    const modal = getBootstrapModal(
        $("#review-modal")
    );

    if (!modal) {
        showStatus(
            "The Bootstrap review modal could not be opened.",
            "danger"
        );

        return;
    }

    modal.show();
}

function closeReviewModal() {
    getBootstrapModal(
        $("#review-modal")
    )?.hide();
}

function openReceiptModal(reference) {
    elements.reportReference.textContent =
        reference;

    getBootstrapModal(
        $("#receipt-modal")
    )?.show();
}

function validateEntireForm() {
    validatePhone();

    form.classList.add("was-validated");

    const invalid =
        findFirstInvalidField(form);

    if (!invalid) {
        return true;
    }

    showStepContainingField(invalid);

    showStatus(
        "Transmission blocked. Review the highlighted fields.",
        "danger"
    );

    setTimeout(() => {
        invalid.scrollIntoView({
            behavior:
                getScrollBehavior(),
            block: "center"
        });

        invalid.focus({
            preventScroll: true
        });

        invalid.reportValidity();
    }, 0);

    return false;
}

function createReportReference(
    threatLevel
) {
    const date = getLocalDateString(
        new Date()
    ).replaceAll("-", "");

    const code = createUniqueId()
        .replaceAll("-", "")
        .slice(0, 6)
        .toUpperCase();

    return [
        "UNIT",
        date,
        (
            threatLevel || "UNSET"
        ).toUpperCase(),
        code
    ].join("-");
}

function createStoredReport() {
    const fields = collectFormFields();

    const assessment =
        state.lastAssessment ||
        calculateThreatAssessment();

    return {
        version: 1,
        id: createUniqueId(),
        reference:
            createReportReference(
                fields.threatLevel
            ),
        createdAt:
            new Date().toISOString(),
        status: "simulated",
        witness: {
            fullName: fields.fullName,
            email: fields.email,
            phone:
                normalizeInternationalPhone(
                    fields.phone
                ),
            birthDate: fields.birthDate
        },
        incident: {
            date: fields.incidentDate,
            type: fields.incidentType,
            location: fields.location,
            description:
            fields.incidentReport,
            missingPerson: {
                count:
                fields.missingPeopleCount,
                lastKnownContact:
                fields.lastKnownContact,
                witnessed:
                    Boolean(
                        fields
                            .disappearanceWitnessed
                    )
            },
            temporal: {
                perceivedDate:
                fields.perceivedDate,
                displacement:
                fields
                    .temporalDisplacement,
                memoryEffects:
                fields.memoryEffects
            },
            timeline:
                state.timeline.map(
                    event => ({ ...event })
                )
        },
        doctor: {
            presence:
            fields.doctorPresence,
            previousContact:
            fields.previousDoctorContact,
            evidence:
                fields[
                    "doctorEvidence[]"
                    ] || [],
            description:
            fields.doctorDescription
        },
        evidence: {
            selected:
                fields["evidence[]"] || [],
            video: {
                duration:
                fields.videoDuration,
                device:
                fields.recordingDevice,
                modified:
                    Boolean(
                        fields.videoModified
                    )
            },
            physicalObject: {
                isolated:
                    Boolean(
                        fields.objectIsolated
                    ),
                containment:
                fields.objectContainment
            },
            otherWitnesses: {
                count:
                fields.witnessCount,
                contact:
                fields.witnessContact
            }
        },
        threatAssessment: assessment
    };
}

async function submitReport(report) {
    /*
     * Static frontend portfolio demonstration.
     *
     * GitHub Pages cannot execute PHP or connect to
     * PostgreSQL. This function simulates a successful
     * response without transmitting or permanently storing
     * the completed report.
     */

    await new Promise(resolve => {
        window.setTimeout(
            resolve,
            CONFIG.transmissionDelay
        );
    });

    return {
        ok: true,
        reference: report.reference,
        createdAt:
            new Date().toISOString(),
        demoMode: true
    };
}

function resetApplicationAfterTransmission() {
    clearTimeout(state.autoSaveTimer);

    state.autoSaveTimer = null;
    state.isRestoringDraft = true;

    form.reset();

    state.timeline = [];
    state.currentStep = 0;
    state.lastAssessment = null;

    renderTimeline();

    updateAllConditionalSections({
        clearHidden: true
    });

    updateAllCharacterCounters();

    form.classList.remove(
        "was-validated"
    );

    elements.phoneInput
        .setCustomValidity("");

    elements.phoneHelp.classList.remove(
        "field-help-error"
    );

    showStep(
        0,
        { focus: false }
    );

    setDraftStatus(
        "No local draft has been saved."
    );

    clearStatus();

    state.isRestoringDraft = false;
}

async function confirmTransmission() {
    if (state.isTransmitting) {
        return;
    }

    if (!validateEntireForm()) {
        closeReviewModal();
        return;
    }

    const report = createStoredReport();

    const originalButtonText =
        elements.confirmTransmissionButton
            .textContent;

    state.isTransmitting = true;

    elements.confirmTransmissionButton
        .disabled = true;

    elements.confirmTransmissionButton
        .textContent =
        "Simulating Transmission...";

    try {
        const result =
            await submitReport(report);

        localStorage.removeItem(
            CONFIG.storageKeys.draft
        );

        closeReviewModal();

        resetApplicationAfterTransmission();

        openReceiptModal(
            result.reference
        );
    } catch (error) {
        console.error(
            "Simulated report transmission failed.",
            error
        );

        closeReviewModal();

        showStatus(
            "The demonstration could not complete " +
            "the simulated transmission. " +
            "The local draft has been retained.",
            "danger"
        );

        saveDraft({ silent: true });
    } finally {
        state.isTransmitting = false;

        elements.confirmTransmissionButton
            .disabled = false;

        elements.confirmTransmissionButton
            .textContent =
            originalButtonText;
    }
}

function handleSubmit(event) {
    event.preventDefault();

    if (!validateEntireForm()) {
        return;
    }

    updateThreatAssessment();
    renderReviewPreview();
    openReviewModal();
}

function handleReset(event) {
    if (
        !window.confirm(
            "Delete all information from this unsent " +
            "report and remove its local draft?"
        )
    ) {
        event.preventDefault();
        return;
    }

    clearTimeout(state.autoSaveTimer);

    state.autoSaveTimer = null;
    state.isRestoringDraft = true;

    localStorage.removeItem(
        CONFIG.storageKeys.draft
    );

    setTimeout(() => {
        state.timeline = [];
        state.currentStep = 0;
        state.lastAssessment = null;

        renderTimeline();

        updateAllConditionalSections({
            clearHidden: true
        });

        updateAllCharacterCounters();

        form.classList.remove(
            "was-validated"
        );

        elements.phoneInput
            .setCustomValidity("");

        elements.phoneHelp.classList.remove(
            "field-help-error"
        );

        clearStatus();

        setDraftStatus(
            "No local draft has been saved."
        );

        showStep(
            0,
            { focus: false }
        );

        state.isRestoringDraft = false;

        elements.fullNameInput.focus();
    }, 0);
}

function addEventListeners() {
    elements.themeButton
        .addEventListener(
            "click",
            toggleTheme
        );

    elements.phoneInput
        .addEventListener(
            "input",
            sanitizePhoneInput
        );

    elements.phoneInput
        .addEventListener(
            "blur",
            normalizePhoneAfterEditing
        );

    elements.saveDraftButton
        .addEventListener(
            "click",
            () => saveDraft()
        );

    elements.saveDraftBottomButton
        .addEventListener(
            "click",
            () => saveDraft()
        );

    elements.deleteDraftButton
        .addEventListener(
            "click",
            () => deleteLocalDraft()
        );

    elements.previousStepButton
        .addEventListener(
            "click",
            moveToPreviousStep
        );

    elements.nextStepButton
        .addEventListener(
            "click",
            moveToNextStep
        );

    elements.incidentTypeSelect
        .addEventListener(
            "change",
            () => {
                updateIncidentTypeDetails();
                scheduleAutoSave();
            }
        );

    threatLevelInputs.forEach(radio => {
        radio.addEventListener(
            "change",
            () => {
                updateGlobalRiskConfirmation();
                updateThreatAssessment();
                scheduleAutoSave();
            }
        );
    });

    doctorPresenceInputs.forEach(radio => {
        radio.addEventListener(
            "change",
            () => {
                updateDoctorDetails();
                updateThreatAssessment();
                scheduleAutoSave();
            }
        );
    });

    elements.videoRecording
        .addEventListener(
            "change",
            () => {
                updateVideoDetails();
                updateThreatAssessment();
                scheduleAutoSave();
            }
        );

    elements.physicalObject
        .addEventListener(
            "change",
            () => {
                updatePhysicalObjectDetails();
                updateThreatAssessment();
                scheduleAutoSave();
            }
        );

    elements.otherWitnesses
        .addEventListener(
            "change",
            () => {
                updateWitnessDetails();
                updateThreatAssessment();
                scheduleAutoSave();
            }
        );

    elements.addTimelineEventButton
        .addEventListener(
            "click",
            () => {
                addTimelineEvent(
                    elements.timelineTime.value,
                    elements.timelineDescription
                        .value
                );
            }
        );

    elements.timelineDescription
        .addEventListener(
            "keydown",
            event => {
                if (event.key === "Enter") {
                    event.preventDefault();

                    addTimelineEvent(
                        elements.timelineTime
                            .value,
                        elements
                            .timelineDescription
                            .value
                    );
                }
            }
        );

    elements.timelineList
        .addEventListener(
            "click",
            event => {
                const button =
                    event.target.closest(
                        "[data-timeline-id]"
                    );

                if (button) {
                    removeTimelineEvent(
                        button.dataset.timelineId
                    );
                }
            }
        );

    form.addEventListener(
        "input",
        event => {
            if (
                event.target !==
                elements.timelineTime &&
                event.target !==
                elements.timelineDescription
            ) {
                scheduleAutoSave();
            }
        }
    );

    form.addEventListener(
        "change",
        event => {
            if (
                event.target.matches(
                    'input[name="evidence[]"]'
                )
            ) {
                updateThreatAssessment();
            }

            scheduleAutoSave();
        }
    );

    form.addEventListener(
        "submit",
        handleSubmit
    );

    elements.resetButton
        .addEventListener(
            "click",
            handleReset
        );

    elements.confirmTransmissionButton
        .addEventListener(
            "click",
            confirmTransmission
        );
}

function initializeApplication() {
    if (
        !form ||
        formSteps.length === 0
    ) {
        console.error(
            "UNIT form could not be initialized."
        );

        return;
    }

    applyTheme(getInitialTheme());

    configureDateLimits();

    $$(
        "textarea[maxlength]",
        form
    ).forEach(createCharacterCounter);

    updateAllConditionalSections({
        clearHidden: false
    });

    renderTimeline();

    showStep(
        0,
        { focus: false }
    );

    updateThreatAssessment();

    addEventListeners();

    offerDraftRestoration();

    console.info(
        "UNIT frontend demonstration initialized."
    );
}

initializeApplication();