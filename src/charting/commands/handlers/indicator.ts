import type { CommandExecutor } from '../types';

const norm = (value: any): string =>
    String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const studyNameOf = (study: any): string =>
    String(study?.name || study?.description || '').trim();

const findStudyMatches = (studies: any[], targetName: string): any[] => {
    const target = norm(targetName);
    if (!target) return [];
    return studies.filter((study) => {
        const current = norm(studyNameOf(study));
        if (!current) return false;
        return current === target || current.includes(target) || target.includes(current);
    });
};

export const IndicatorHandler: CommandExecutor = {
    execute: async (chart: any, params: any) => {
        const action = params?.action_type || params?.action;
        if (!chart) throw new Error('No chart instance available');

        if (action === 'add_indicator') {
            const name = String(params?.name || '').trim();
            if (!name) throw new Error('add_indicator requires name');
            const inputs = params?.inputs || {};
            const forceOverlay = Boolean(params?.forceOverlay);
            chart.createStudy(name, forceOverlay, false, inputs);
            return;
        }

        if (action === 'clear_indicators') {
            const keepVolume = Boolean(params?.keep_volume || params?.keepVolume);
            const studies = chart.getAllStudies?.() || [];
            for (const study of studies) {
                const studyName = studyNameOf(study);
                if (keepVolume && norm(studyName) === 'volume') {
                    continue;
                }
                try {
                    chart.removeEntity(study.id);
                } catch (e) {
                    console.warn('[IndicatorHandler] Failed to remove study', studyName, e);
                }
            }
            return;
        }

        if (action === 'remove_indicator') {
            const name = String(params?.name || '').trim();
            if (!name) throw new Error('remove_indicator requires name');
            const studies = chart.getAllStudies?.() || [];
            const matches = findStudyMatches(studies, name);
            if (matches.length === 0) {
                throw new Error(`Indicator '${name}' not found`);
            }
            for (const study of matches) {
                chart.removeEntity(study.id);
            }
            return;
        }

        throw new Error(`Unsupported indicator action: ${action}`);
    },
};

