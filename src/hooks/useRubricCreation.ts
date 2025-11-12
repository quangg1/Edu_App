import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Rubric } from '../types/rubric'; // Adjust the import path as needed

export const useRubricCreation = () => {
    const navigate = useNavigate();

    const handleRubricCreation = useCallback((
        initialRubric: Partial<Rubric>, 
        streamParams: Record<string, string>,
        attachedFile: File | null, 
        tempId: string
    ) => {
        // Navigate directly to the detail page with all necessary data
        navigate(`/rubrics/${tempId}`, {
            state: {
                isStreaming: true,
                streamParams,
                initialRubricData: initialRubric,
                attachedFile
            }
        });
    }, [navigate]);

    return { handleRubricCreation };
};