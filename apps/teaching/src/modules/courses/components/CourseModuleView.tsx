import { Accordions } from '@repo/ui/app';
import { StudyMaterialView } from '@modules/study-materials/components';
import { ICourseModule, IMaterial, ITestPaper, useStores } from '@stores';
import { observer } from 'mobx-react-lite';

interface IProps {
  courseModule: ICourseModule;
}

export const CourseModuleView = observer(({ courseModule }: IProps) => {
  const { materialStore, testPaperStore } = useStores();
  const { getMaterialsByIds } = materialStore;
  const { getTestPapersByIds } = testPaperStore;

  return (
    <div>
      {/* <Label label="Study Materials" /> */}
      <Accordions
        items={getMaterialsByIds(courseModule.materials).map((material: IMaterial) => ({
          title: (
            <div className="flex justify-between w-full items-center relative">
              <div className="text-sm font-semibold text-blue-primary">{material.name}</div>
            </div>
          ),
          component: <StudyMaterialView material={material} />,
        }))}
      />
      {/* <Label label="Test Papers" /> */}
      <Accordions
        items={getTestPapersByIds(courseModule.testPapers).map((testPaper: ITestPaper) => ({
          title: (
            <div className="flex justify-between w-full items-center relative">
              <div className="text-sm font-semibold text-blue-primary">{testPaper.name}</div>
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
});
