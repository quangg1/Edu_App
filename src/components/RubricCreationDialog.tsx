import { Dispatch, SetStateAction } from 'react';
import RubricDialog from './RubricDialog';
import { useRubricCreation } from '../hooks/useRubricCreation';

interface RubricCreationDialogProps {
    open: boolean;
    onOpenChange: Dispatch<SetStateAction<boolean>>;
}

export const RubricCreationDialog = ({ open, onOpenChange }: RubricCreationDialogProps) => {
    const { handleRubricCreation } = useRubricCreation();

    return (
        <RubricDialog 
            open={open}
            onOpenChange={onOpenChange}
            onRubricCreated={handleRubricCreation}
        />
    );
};