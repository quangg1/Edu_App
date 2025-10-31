import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { RubricCreationDialog } from './RubricCreationDialog';
import { useState } from 'react';

export const CreateRubricButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Tạo Rubrics mới
            </Button>
            <RubricCreationDialog open={isOpen} onOpenChange={setIsOpen} />
        </>
    );
};