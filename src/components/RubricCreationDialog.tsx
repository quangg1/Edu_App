import { useState } from 'react';
import RubricDialog from './RubricDialog';
import { useRubricCreation } from '../hooks/useRubricCreation';

export const RubricCreationDialog = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { handleRubricCreation } = useRubricCreation();

    return (
        <RubricDialog 
            open={isOpen}
            onOpenChange={setIsOpen}
            onStreamStartNavigate={handleRubricCreation}
        />
    );
};