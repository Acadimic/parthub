import { type MaterialDto, type TestPaperDto } from '@repo/shared/contracts';
import { Accordions } from '@repo/ui/app';
import { StudyMaterialView } from '@modules/study-materials/components';
import { type ICourseModule, useMaterialLookups, useTestPaperLookups } from '@stores';

interface IProps {
  courseModule: ICourseModule;
}

export const CourseModuleView = ({ courseModule }: IProps) => {
  const materialStore = useMaterialLookups();
  const testPaperStore = useTestPaperLookups();
  const { getMaterialsByIds } = materialStore;
  const { getTestPapersByIds } = testPaperStore;

  return (
    <div>
      {/* <Label label="Study Materials" /> */}
      <Accordions
        items={getMaterialsByIds(courseModule.materials ?? []).map((material: MaterialDto) => ({
          title: (
            <div className="flex justify-between w-full items-center relative">
              <div className="text-sm font-semibold text-primary">{material.name}</div>
            </div>
          ),
          component: <StudyMaterialView material={material} />,
        }))}
      />
      {/* <Label label="Test Papers" /> */}
      <Accordions
        items={getTestPapersByIds(courseModule.testPapers ?? []).map((testPaper: TestPaperDto) => ({
          title: (
            <div className="flex justify-between w-full items-center relative">
              <div className="text-sm font-semibold text-primary">{testPaper.name}</div>
              {/* {onEdit && (
                <div className="absolute -right-4">
                  <Menu
                    menuItems={[
                      {
                        label: 'Edit',
                        onClick: () => onEdit(courseModule),
                        icon: <PencilIcon weight="bold" className="w-4 h-4" />,
                      },
                    ]}
                    className=""
                  />
                </div>
              )} */}
            </div>
          ),
          component: <div>{testPaper.name}</div>,
        }))}
      />
    </div>
  );
};
